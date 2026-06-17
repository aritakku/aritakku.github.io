this.ZLLBoxSorterObj = {
  id: null,
  version: null,
  rootURI: null,
  initialized: false,
  addedElementIDs: [],
  prefObserverId: null,

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

    // Register a live branch observer hook to capture real-time changes
    this.prefObserverId = Zotero.Prefs.registerObserver(
      "zotero-layout-lab.order", 
      () => {
        Zotero.debug("[ZLL Sorter] Order preference change detected. Realigning layout panes...");
        this.addToAllWindows(); // Re-runs the mapping loop across windows immediately
      }
    );
  },
  destroy() {},

  /* ==============================================================================
     DYNAMIC RIGHT-HAND SIDE PANEL SORTING ARCHITECTURE
     ============================================================================== */
  applyFlexLayoutHack(win) {
    if (!win || !win.document) return;
    const doc = win.document;

    // Define the structural ID lookup map
    const layoutElements = [
      { id: "zotero-editpane-info-box",            pref: "info-box" },
      { id: "zotero-editpane-abstract",            pref: "abstract" },
      { id: "zotero-editpane-attachments",         pref: "attachments" },
      { id: "zotero-editpane-notes",               pref: "notes" },
      { id: "zotero-editpane-attachment-annotations", pref: "attachment-annotations" },
      { id: "zotero-editpane-libraries-collections", pref: "libraries-collections" },
      { id: "zotero-editpane-tags",                pref: "tags" },
      { id: "zotero-editpane-related",             pref: "related" }
    ];

    const tryApplyDynamicSort = () => {
      let elementsFoundCount = 0;

      // 1. Check how many targeted structural containers exist in the current DOM state
      layoutElements.forEach(item => {
        if (doc.getElementById(item.id)) {
          elementsFoundCount++;
        }
      });

      // 2. Only perform operations once the React engine completes rendering the target node blocks
      if (elementsFoundCount > 0) {
        layoutElements.forEach(item => {
          const domNode = doc.getElementById(item.id);
          if (domNode) {
            // Retrieve user selection value from disk preference strings safely
            const preferenceKey = `extensions.zotero.zotero-layout-lab.order.${item.pref}`;
            const targetOrderValue = Zotero.Prefs.get(preferenceKey, true);
            
            // Inject the priority order style string modification directly
            domNode.style.order = String(targetOrderValue);
          }
        });
        return true;
      }
      return false;
    };

    // Run lookups immediately if frame context is already live
    if (tryApplyDynamicSort()) return;

    // If React rendering latency delays box loading, loop recursively until elements mount
    const intervalId = win.setInterval(() => {
      if (tryApplyDynamicSort()) {
        win.clearInterval(intervalId);
        this.openLayoutObservers.delete(win);
      }
    }, 250);

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

    // Clear background interval timers
    if (this.openLayoutObservers.has(window)) {
      window.clearInterval(this.openLayoutObservers.get(window));
      this.openLayoutObservers.delete(window);
    }

    // Reset inline Flexbox order priorities to default state
    const ids = [
      "zotero-editpane-info-box", "zotero-editpane-abstract", "zotero-editpane-attachments",
      "zotero-editpane-notes", "zotero-editpane-attachment-annotations",
      "zotero-editpane-libraries-collections", "zotero-editpane-tags", "zotero-editpane-related"
    ];
    ids.forEach(id => {
      const node = doc.getElementById(id);
      if (node) node.style.order = ""; // Deletes custom sequence numbers cleanly
    });

    // Remove custom generated items from your tracking cache arrays
    for (let id of this.addedElementIDs) {
      doc.getElementById(id)?.remove();
    }
    this.addedElementIDs = [];

    var link = doc.querySelector('[href="zotero-layout-lab.ftl"]');
    if (link) {
      link.remove();
    }

  },

  removeFromAllWindows() {
    // 1. Clear active preferences observer channel
    if (this.prefObserverId) {
      Zotero.Prefs.unregisterObserver(this.prefObserverId);
      this.prefObserverId = null;
    }

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
