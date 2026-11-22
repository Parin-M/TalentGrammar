const fields = ["enabled", "english", "persian", "live", "selection"];
chrome.storage.sync.get(Object.fromEntries(fields.map(k => [k, true])), data => fields.forEach(k => document.getElementById(k).checked = data[k]));
document.getElementById("save").addEventListener("click", () => {
  const values = Object.fromEntries(fields.map(k => [k, document.getElementById(k).checked]));
  chrome.storage.sync.set(values, () => { document.getElementById("saved").textContent = "Saved"; });
});
