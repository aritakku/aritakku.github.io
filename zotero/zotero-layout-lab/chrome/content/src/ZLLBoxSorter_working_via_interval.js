ZLLBoxSorterObj = {
  id: null,
  version: null,
  rootURI: null,
  initialized: false,
  addedElementIDs: [],
  verifiedTagsBoxId: "zotero-editpane-tags",
  verifiedInfoBoxId: "zotero-editpane-info-box",
  
  openLayoutObservers: new Map(),
  prefObserverId: null, // Added to track our preference channel lifecycle

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

    // LIVE UPDATE LINK: Listen specifically to any mutations inside the order branch
    if (!this.prefObserverId) {
      this.prefObserverId = Zotero.Prefs.registerObserver(
        "zotero-layout-lab.order",
        () => {
          this.log("Preference shift detected! Re-applying dynamic layout sort rules...");
          this.addToAllWindows(); // Re-runs layout logic across all open windows instantly
        }
      );
    }
  },

  applyFlexLayoutHack(win) {
    if (!win || !win.document) return;
    const doc = win.document;
    const self = this;

    // The sub-keys mapping to your preferences registry paths
    const layoutItems = [
      "info-box",
      "abstract",
      "attachments",
      "notes",
      "attachment-annotations",
      "libraries-collections",
      "tags",
      "related"
    ];

    const tryApplyDynamicSort = () => {
      let appliedAny = false;

      layoutItems.forEach(key => {
        // 1. Fetch the physical element ID string from preferences
        const idPrefKey = `extensions.zotero.zotero-layout-lab.id.${key}`;
        const targetElementId = Zotero.Prefs.get(idPrefKey, true);

        if (targetElementId) {
          // 2. Locate the DOM element using the dynamically fetched ID
          const domNode = doc.getElementById(targetElementId);
          
          if (domNode) {
            // 3. Fetch the sorting integer order from preferences
            const orderPrefKey = `extensions.zotero.zotero-layout-lab.order.${key}`;
            const targetOrderValue = Zotero.Prefs.get(orderPrefKey, true);
            
            // 4. Apply the styles rule
            domNode.style.order = String(targetOrderValue);
            appliedAny = true;

            // Optional trace logging
            // self.log(`Sorted Element [${targetElementId}] with priority order [${targetOrderValue}]`);
          }
        }
      });

      return appliedAny;
    };

    // Run layout modifications immediately
    tryApplyDynamicSort();

    // Clear background interval gaps to keep execution thread clean
    if (this.openLayoutObservers.has(win)) {
      win.clearInterval(this.openLayoutObservers.get(win));
    }

    // Keep checking recursively to handle React re-renders when switching selected items
    const intervalId = win.setInterval(() => {
      tryApplyDynamicSort();
    }, 300);

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

  removeFromWindow(window) {
    var doc = window.document;

    // 1. Stop background interval checks for this window context frame
    if (this.openLayoutObservers.has(window)) {
      window.clearInterval(this.openLayoutObservers.get(window));
      this.openLayoutObservers.delete(window);
    }

    // 2. Dynamically reset layout modification priorities back to default state
    const layoutItems = [
      "info-box", "abstract", "attachments", "notes",
      "attachment-annotations", "libraries-collections", "tags", "related"
    ];

    layoutItems.forEach(key => {
      const idPrefKey = `extensions.zotero.zotero-layout-lab.id.${key}`;
      const targetElementId = Zotero.Prefs.get(idPrefKey, true);
      
      if (targetElementId) {
        const node = doc.getElementById(targetElementId);
        if (node) {
          node.style.order = ""; // Resets CSS order property
        }
      }
    });
  },

  removeFromAllWindows() {
    // Teardown the preference observer channel safely to prevent profile background memory leaks
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

  destroy() {
    this.removeFromAllWindows();
    this.initialized = false;
  },

  async main() {
    this.log("Box Sorter Engine Subsystem Initialized Active.");
  }
};