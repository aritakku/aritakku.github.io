this.ZLLBoxSorterObj = {
  id: null,
  version: null,
  rootURI: null,
  initialized: false,
  addedElementIDs: [],
  verifiedTagsBoxId: "zotero-editpane-tags",
  verifiedInfoBoxId: "zotero-editpane-info-box",

  openLayoutObservers: new Map(),

  init({ id, version, rootURI }) {
    if (this.initialized) return;
    this.id = id;
    this.version = version;
    this.rootURI = rootURI;
    this.initialized = true;
  },

  log(msg) {
    Zotero.debug("[ZLL Box Sorter]: " + msg);
  },

  execute() {
    this.addToAllWindows();
  },

  destroy() {},

  /* ==============================================================================
    RIGHT-HAND SIDE PANEL TAG SORTING (FLEXBOX OVERRIDE)
    ============================================================================== */
  applyFlexLayoutHack(win) {
    if (!win || !win.document) return;
    const doc = win.document;

    const tryApply = () => {
      const tagsBox = doc.getElementById(this.verifiedTagsBoxId);
      const infoBox = doc.getElementById(this.verifiedInfoBoxId);
      if (tagsBox && infoBox) {
        tagsBox.style.order = "-2";
        infoBox.style.order = "-1";
        return true;
      }
      return false;
    };

    if (tryApply()) return;

    // Use interval to bypass dynamic React side pane rendering latency cycles safely
    const intervalId = win.setInterval(() => {
      if (tryApply()) {
        win.clearInterval(intervalId);
        this.openLayoutObservers.delete(win);
      }
    }, 200);

    this.openLayoutObservers.set(win, intervalId);
  },

  addToWindow(window) {
    this.applyFlexLayoutHack(window);
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
    var link = doc.querySelector('[href="zotero-layout-lab.ftl"]');
    if (link) {
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

  async main() {
    // Global properties are included automatically in Zotero 7
    var host = new URL("https://foo.com/path").host;
    this.log(`Host is ${host}`);

    // Retrieve a global pref
    this.log(
      `Pref test value = ${Zotero.Prefs.get("extensions.zotero.zotero-layout-lab.pref.test", true)}`,
    );
  },
};
