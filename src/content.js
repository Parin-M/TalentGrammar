(() => {
  let panel;
  let timer;
  let lastTarget = null;

  const editable = (element) => element && (element.isContentEditable || /^(TEXTAREA|INPUT)$/.test(element.tagName));
  const textInput = (element) => element?.tagName === "TEXTAREA"
    || (element?.tagName === "INPUT" && /^(text|search|email|url|tel)$/i.test(element.type || "text"));

  function caretOffset(element, range) {
    const before = range.cloneRange();
    before.selectNodeContents(element);
    before.setEnd(range.startContainer, range.startOffset);
    return before.toString().length;
  }

  function readText(element) {
    if (textInput(element)) return { text: element.value, caret: element.selectionStart ?? element.value.length };
    const text = element.textContent || "";
    const selection = getSelection();
    if (!selection?.rangeCount || !element.contains(selection.anchorNode)) return { text, caret: text.length };
    return { text, caret: caretOffset(element, selection.getRangeAt(0)) };
  }

  function panelFor() {
    if (panel?.isConnected) return panel;
    panel = document.createElement("div");
    panel.className = "tg-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "TalentGrammar suggestion");
    document.documentElement.append(panel);
    return panel;
  }

  function hide() {
    if (panel) panel.hidden = true;
  }

  function replaceText(element, fix) {
    if (textInput(element)) {
      element.setRangeText(fix.replacement, fix.from, fix.to, "end");
      element.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        inputType: "insertReplacementText",
        data: fix.replacement,
      }));
      element.focus();
      return;
    }

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    let offset = 0;
    while ((node = walker.nextNode())) {
      nodes.push({ node, start: offset, end: offset + node.textContent.length });
      offset += node.textContent.length;
    }
    const start = nodes.find((entry) => fix.from >= entry.start && fix.from <= entry.end);
    const end = nodes.find((entry) => fix.to >= entry.start && fix.to <= entry.end);
    if (!start || !end) return;

    const range = document.createRange();
    range.setStart(start.node, fix.from - start.start);
    range.setEnd(end.node, fix.to - end.start);
    range.deleteContents();
    range.insertNode(document.createTextNode(fix.replacement));
    element.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertReplacementText",
      data: fix.replacement,
    }));
  }

  function showFix(element, fix) {
    const popover = panelFor();
    popover.replaceChildren();

    const title = document.createElement("div");
    title.className = "tg-title";
    title.textContent = "TalentGrammar";

    const row = document.createElement("div");
    row.className = "tg-suggestion";
    const original = document.createElement("span");
    original.className = "tg-before";
    original.textContent = fix.original;
    const replacement = document.createElement("strong");
    replacement.className = "tg-after";
    replacement.textContent = fix.replacement;
    row.append(original, document.createTextNode(" → "), replacement);

    const actions = document.createElement("div");
    actions.className = "tg-actions";
    const accept = document.createElement("button");
    accept.type = "button";
    accept.textContent = "Accept";
    accept.addEventListener("click", () => {
      replaceText(element, fix);
      hide();
    });
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "tg-dismiss";
    dismiss.textContent = "Dismiss";
    dismiss.addEventListener("click", hide);
    actions.append(accept, dismiss);
    popover.append(title, row, actions);

    const rect = element.getBoundingClientRect();
    popover.style.top = Math.max(8, rect.bottom + window.scrollY + 6) + "px";
    popover.style.left = Math.max(8, Math.min(window.innerWidth - 310, rect.left + window.scrollX)) + "px";
    popover.hidden = false;
  }

  function check(element, selectedText = "") {
    if (!editable(element)) return;
    let { text, caret } = readText(element);
    let baseOffset = 0;

    if (selectedText && textInput(element)) {
      const start = element.selectionStart;
      const end = element.selectionEnd;
      if (start != null && end != null && end > start && text.slice(start, end) === selectedText) {
        baseOffset = start;
        text = selectedText;
        caret = selectedText.length;
      }
    } else if (selectedText && element.isContentEditable) {
      const selection = getSelection();
      if (selection?.rangeCount && element.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        if (range.toString() === selectedText) {
          baseOffset = caretOffset(element, range);
          text = selectedText;
          caret = selectedText.length;
        }
      }
    }

    if (!text.trim()) {
      hide();
      return;
    }

    lastTarget = element;
    chrome.runtime.sendMessage({ type: "TG_CHECK", text, caret }, (response) => {
      if (chrome.runtime.lastError || !response || !element.isConnected || lastTarget !== element) return;
      const fix = response.fixes?.[0];
      if (!fix) {
        hide();
        return;
      }
      showFix(element, {
        ...fix,
        from: fix.from + baseOffset,
        to: fix.to + baseOffset,
      });
    });
  }

  document.addEventListener("input", (event) => {
    const element = event.target;
    if (!editable(element)) return;
    chrome.storage.sync.get({ live: true }, (preferences) => {
      if (!preferences.live) return;
      clearTimeout(timer);
      timer = setTimeout(() => check(element), 450);
    });
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hide();
  }, true);

  document.addEventListener("focusin", (event) => {
    if (editable(event.target)) lastTarget = event.target;
  }, true);

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== "TG_CHECK_SELECTION") return;
    const element = lastTarget?.isConnected ? lastTarget : document.activeElement;
    if (editable(element)) check(element, String(message.selectionText || ""));
  });
})();
