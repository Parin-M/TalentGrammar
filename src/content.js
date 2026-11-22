(() => {
  const editable = el => el && (el.isContentEditable || /^(TEXTAREA|INPUT)$/.test(el.tagName));
  let panel;
  function ensurePanel() {
    if (panel?.isConnected) return panel;
    panel = document.createElement("div");
    panel.className = "tg-panel";
    panel.setAttribute("role", "status");
    panel.hidden = true;
    document.documentElement.append(panel);
    return panel;
  }
  function show(text, anchor) {
    const p = ensurePanel();
    p.textContent = "";
    const heading = document.createElement("strong");
    heading.textContent = "TalentGrammar";
    const body = document.createElement("p");
    body.textContent = text || "No suggestion engine is configured yet. Model integration is coming next.";
    p.append(heading, body);
    const r = anchor?.getBoundingClientRect();
    p.style.top = Math.max(8, (r?.bottom ?? 60) + window.scrollY + 8) + "px";
    p.style.left = Math.max(8, Math.min(window.innerWidth - 300, r?.left ?? 16)) + "px";
    p.hidden = false;
    clearTimeout(show.timer);
    show.timer = setTimeout(() => { p.hidden = true; }, 7000);
  }
  document.addEventListener("focusin", e => {
    if (editable(e.target)) show("Ready to check English and Persian. Correction engines are not bundled in this starter build.", e.target);
  }, true);
  chrome.runtime.onMessage.addListener(msg => {
    if (msg?.type === "TG_CHECK_SELECTION") show("Selected text received. Connect the TinyFix/Nevise inference adapters to produce suggestions.", document.activeElement);
  });
})();
