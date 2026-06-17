ZLLAnnotationManagerObj = {
  id: null,
  version: null,
  rootURI: null,
  initialized: false,
  addedElementIDs: [],
  schemaBase: "extensions.zotero.zotero-layout-lab.schema.",
  schemaColors: ["purple", "blue", "orange", "green", "red", "magenta", "gray", "yellow"],

  init({ id, version, rootURI }) {
    if (this.initialized) return;
    this.id = id;
    this.version = version;
    this.rootURI = rootURI;
    this.initialized = true;
  },

  log(msg) {
    Zotero.debug("[ZLL Annotation Manager]: " + msg);
  },

  execute() {
    this.addToAllWindows();
  },

  destroy() {
    this.removeFromAllWindows();
  },

  /**
   * Reads flat Zotero configuration keys and reconstructs the memory schema object
   */
  loadSchemaFromPrefs() {
    const colors = this.schemaColors;
    const basePref = this.schemaBase;
    const loadedSchema = {};

    for (let color of colors) {
      loadedSchema[color] = {
        logic: Zotero.Prefs.get(`${basePref}${color}.logic`, true),
        functionText: Zotero.Prefs.get(`${basePref}${color}.functionText`, true),
        obsidian: Zotero.Prefs.get(`${basePref}${color}.obsidian`, true),
        emoji: Zotero.Prefs.get(`${basePref}${color}.emoji`, true)
      };
    }
    
    this.schema = loadedSchema;
    return this.schema;
  },

  /**
   * flattens an active memory schema object out and persists it directly into Zotero prefs
   */
  saveSchemaToPrefs(schemaObject) {
    const targetSchema = schemaObject || this.schema;
    if (!targetSchema) return;

    const basePref = this.schemaBase;

    for (let color in targetSchema) {
      if (targetSchema.hasOwnProperty(color)) {
        Zotero.Prefs.set(`${basePref}${color}.logic`, targetSchema[color].logic);
        Zotero.Prefs.set(`${basePref}${color}.functionText`, targetSchema[color].functionText);
        Zotero.Prefs.set(`${basePref}${color}.obsidian`, targetSchema[color].obsidian);
        Zotero.Prefs.set(`${basePref}${color}.emoji`, targetSchema[color].emoji);
      }
    }
  },

  addToWindow(window) {
    let doc = window.document;

    // Add a stylesheet to the main Zotero pane
    let link1 = doc.createElement("link");
    link1.id = "zll-stylesheet";
    link1.type = "text/css";
    link1.rel = "stylesheet";
    link1.href = "chrome://zotero-layout-lab/chrome/content/styles/zll.css";
    doc.documentElement.appendChild(link1);
    this.storeAddedElement(link1);

    // Use Fluent for localization
    window.MozXULElement.insertFTLIfNeeded("zotero-layout-lab.ftl");

    // Add menu option
    let menuitem = doc.createXULElement("menuitem");
    menuitem.id = "make-it-green-instead";
    menuitem.setAttribute("type", "checkbox");
    menuitem.setAttribute("data-l10n-id", "make-it-red-green-instead");
    // MozMenuItem#checked is available in Zotero 7
    menuitem.addEventListener("command", () => {
      alert("addToWindow, line 50");
    });
    doc.getElementById("menu_viewPopup").appendChild(menuitem);
    this.storeAddedElement(menuitem);
  },

  addToAllWindows() {
    var windows = Zotero.getMainWindows();
    for (let win of windows) {
      if (!win.ZoteroPane) continue;
      this.addToWindow(win);
    }
  },

  storeAddedElement(elem) {
    if (!elem.id) {
      throw new Error("Element must have an id");
    }
    this.addedElementIDs.push(elem.id);
  },

  removeFromWindow(window) {
    var doc = window.document;
    // Remove all elements added to DOM
    for (let id of this.addedElementIDs) {
      doc.getElementById(id)?.remove();
    }
    const link = doc.querySelector('[href="zotero-layout-lab.ftl"]');
    if (link !== null) {
      link.remove();
    }
  },

  removeFromAllWindows() {
    var windows = Zotero.getMainWindows();
    for (let win of windows) {
      if (!win.ZoteroPane) continue;
      this.removeFromWindow(win);
    }
  },

  toggleGreen(window, enabled) {
    window.document.documentElement.toggleAttribute(
      "data-green-instead",
      enabled,
    );
  },

  async main() {
    // Global properties are included automatically in Zotero 7
    var host = new URL("https://foo.com/path").host;
    this.log(`Host is ${host}`);

    // Retrieve a global pref
    this.log(
      `Intensity is ${Zotero.Prefs.get("extensions.zotero-layout-lab", true)}`,
    );
  },
};
