chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "talentgrammar-check", title: "Check with TalentGrammar", contexts: ["selection", "editable"] });
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "talentgrammar-check" || !tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "TG_CHECK_SELECTION", text: info.selectionText || "" });
});
