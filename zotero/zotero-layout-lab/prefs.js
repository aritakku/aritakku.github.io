document.addEventListener("DOMContentLoaded", async () => {
  const checkbox = document.getElementById("enableFeature");

  // Load pref
  let val = Zotero.Prefs.get(
    "extensions.zotero-layout-lab.enableFeature",
    true,
  );
  checkbox.checked = val;

  // Save pref
  checkbox.addEventListener("change", () => {
    Zotero.Prefs.set(
      "extensions.zotero-layout-lab.enableFeature",
      checkbox.checked,
    );
  });
});
