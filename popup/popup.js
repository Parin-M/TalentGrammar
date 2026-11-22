const enabled = document.querySelector("#enabled");
chrome.storage.sync.get({ enabled: true }, data => { enabled.checked = data.enabled; });
enabled.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: enabled.checked });
  document.querySelector("#state").textContent = enabled.checked ? "Assistant enabled" : "Assistant paused";
});
document.querySelector("#settings").addEventListener("click", () => chrome.runtime.openOptionsPage());
