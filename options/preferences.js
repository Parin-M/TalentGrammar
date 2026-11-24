const fields = ["enabled", "english", "persian", "live", "selection", "motion", "compact"];
const defaults = { enabled: true, english: true, persian: true, live: true, selection: true, motion: true, compact: false };
const saveButton = document.getElementById("save");
const saved = document.getElementById("saved");

chrome.storage.sync.get(defaults, (data) => {
  fields.forEach((key) => {
    const field = document.getElementById(key);
    if (field) field.checked = data[key] ?? defaults[key];
  });
});

saveButton.addEventListener("click", () => {
  const values = Object.fromEntries(fields.map((key) => [key, document.getElementById(key).checked]));
  chrome.storage.sync.set(values, () => {
    saved.textContent = chrome.runtime.lastError ? "Could not save" : "Saved";
    if (!chrome.runtime.lastError) {
      window.setTimeout(() => { saved.textContent = ""; }, 1800);
    }
  });
});
