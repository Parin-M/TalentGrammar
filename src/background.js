import { loadTinyfix } from "tinyfix";

const defaults = { enabled: true, english: true, persian: true, selection: true };
let tinyfixPromise;
let faVocabPromise;

import { normalizePersian, suggestPersian } from "./persian.js";
async function getTinyfix() {
  if (!tinyfixPromise) {
    tinyfixPromise = loadTinyfix({
      baseUrl: chrome.runtime.getURL("models/tinyfix/"),
      mode: "careful",
      wasmPaths: chrome.runtime.getURL("wasm/"),
    });
  }
  return tinyfixPromise;
}

async function getPersianVocabulary() {
  if (!faVocabPromise) {
    faVocabPromise = fetch(chrome.runtime.getURL("models/shekar/fa-vocab.json"))
      .then((response) => {
        if (!response.ok) throw new Error("Persian vocabulary could not be loaded.");
        return response.json();
      })
      .then((rows) => new Map(rows.map(([word, count]) => [normalizePersian(word), Number(count) || 1])));
  }
  return faVocabPromise;
}

async function checkText(text, caret) {
  const preferences = await chrome.storage.sync.get(defaults);
  if (!preferences.enabled) return [];

  const words = [...text.matchAll(/[\p{L}\u200c']+/gu)];
  const current = words.find((match) => caret >= match.index && caret <= match.index + match[0].length)
    || [...words].reverse().find((match) => match.index + match[0].length <= caret);
  if (!current) return [];

  const from = current.index;
  const to = from + current[0].length;
  if (/[\u0600-\u06ff]/.test(current[0])) {
    if (!preferences.persian) return [];
    const suggestion = suggestPersian(current[0], await getPersianVocabulary());
    return suggestion ? [{ ...suggestion, from, to, original: current[0] }] : [];
  }

  if (!preferences.english || !/[A-Za-z]/.test(current[0])) return [];
  const engine = await getTinyfix();
  return (await engine.check(text, { range: [from, to] })).map((fix) => ({ ...fix, language: "en" }));
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "talentgrammar-check",
      title: "Check with TalentGrammar",
      contexts: ["selection", "editable"],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "talentgrammar-check" || !tab?.id) return;
  chrome.storage.sync.get({ selection: true }, (prefs) => {
    if (!prefs.selection) return;
    chrome.tabs.sendMessage(tab.id, {
      type: "TG_CHECK_SELECTION",
      selectionText: info.selectionText || "",
    });
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "TG_CHECK") return;
  checkText(String(message.text || ""), Number(message.caret) || 0)
    .then((fixes) => sendResponse({ fixes }))
    .catch((error) => sendResponse({ fixes: [], error: String(error?.message || error) }));
  return true;
});
