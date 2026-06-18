ZLLBoxSorterObj = {
  id: null,
  version: null,
  rootURI: null,
  initialized: false,
  prefObserverId: null, 
  zoteroNotifierId: null,
  activeWindows: new Map(),

  // Track active MutationObservers per main window to prevent duplication
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

  registerPrefNotifier() {
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

  registerZoteroNotifier() {
    // Store the unique string ID returned upon registration
    this.zoteroNotifierId = Zotero.Notifier.registerObserver({
      notify: async (event, type, ids, extraData) => {
        this.log(`[ZLL] Permanent Notification: Event=${event}, Type=${type}`);
        
        if (type === 'item') {
          // event can be: 'add', 'modify', 'delete', 'trash', 'refresh'
          if (event === 'modify') {
            // Run your layout flex logic on all open windows
            ZLLBoxSorterObj.addToAllWindows();
          }
        }
        
        if (type === 'tab' && event === 'select') {
          // Fires when reader tabs or layout sections shift contexts
          ZLLBoxSorterObj.addToAllWindows();
        }
      }
    }, ['item', 'collection', 'tab', 'share']);
  },

  execute() {
    this.addToAllWindows();
    this.registerPrefNotifier();
    this.registerZoteroNotifier();
  },

  applyFlexLayoutHack(win) {
    if (!win || !win.document) return false;
    const doc = win.document;

    // the parent item javascript selector for all sections
    const itemPaneJsQuerySelector = Zotero.Prefs.get("extensions.zotero.zotero-layout-lab.item-pane.js-query-selector", true);

    // core sections defined in prefs, in case zotero changes dom structure
    var allSectionsInStr = Zotero.Prefs.get("extensions.zotero.zotero-layout-lab.item-pane.core-sections", true);
    const layoutItems = allSectionsInStr.split(",").map(s => s.trim());

    // first, lets sort the non-core sections
    let itemPaneDomNode = doc.querySelector(itemPaneJsQuerySelector);
    if (!itemPaneDomNode) return false;

    // Handle Custom Third-Party Sections first
    let sections = itemPaneDomNode.querySelectorAll("item-pane-custom-section");
    let maxSortOrder = layoutItems.length + sections.length + 1;
    let sortOrder = maxSortOrder;

    this.log(`DBG: layoutItems=${layoutItems.length}, sections=${sections.length}`);

    sections.forEach(section => {
      section.style.order = sortOrder;
      sortOrder--;
      let dbg = "section ";
      if (section.id) {
        dbg += `id: ${section.id}, `;
      }
      dbg += `tagName: ${section.tagName}, sortOrder=${sortOrder}`;
      this.log(`DBG: ${dbg}`);
    });

    // Parse and Map out Core Sections using updated Zotero.Prefs.get (without localized true flag)
    var coreLayoutItems = [];
    layoutItems.forEach(key => {
      // Fetch the physical element ID string from preferences
      const idPrefKey = `extensions.zotero.zotero-layout-lab.id.${key}`;
      const targetElementId = Zotero.Prefs.get(idPrefKey);

      if (targetElementId) {
        // Preferred sort from preferences
        const orderPrefKey = `extensions.zotero.zotero-layout-lab.order.${key}`;
        const targetOrderValue = Number(Zotero.Prefs.get(orderPrefKey));
        coreLayoutItems.push({ targetElementId, targetOrderValue });
      }
    });

    // FIX: Sort DESCENDING (b - a) because our flex assign loops counts DOWNWARDS (sortOrder--).
    // This correctly assigns smaller flex order priorities to lower layout configuration settings numbers.
    coreLayoutItems.sort((a, b) => b.targetOrderValue - a.targetOrderValue);

    let appliedAny = false;
    coreLayoutItems.forEach(item => {
      if (!item.targetElementId) {
        this.log(`Error: no targetElementId specified!`);
      } else {
        const domNode = doc.getElementById(item.targetElementId);

        if (!domNode) {
          // This is expected sometimes on quick item shifts before DOM elements generate
          this.log(`Note: domNode not ready yet for targetElementId: ${item.targetElementId}`);
        } else {
          domNode.style.order = sortOrder;
          sortOrder--;
          appliedAny = true;
        }
      }
    });

    return appliedAny;
  },

  applyFlexLayoutHackOLDER(win) {
    if (!win || !win.document) return false;
    const doc = win.document;

    // the parent item javascript selector for all sections
    const itemPaneJsQuerySelector = Zotero.Prefs.get("extensions.zotero.zotero-layout-lab.item-pane.js-query-selector", true);

    // core sections defined in prefs, in case zotero changes dom structure
    var allSectionsInStr = Zotero.Prefs.get("extensions.zotero.zotero-layout-lab.item-pane.core-sections", true);
    const layoutItems = allSectionsInStr.split(",").map(s => s.trim());

    // first, lets sort the non-core sections
    let itemPaneDomNode = doc.querySelector(itemPaneJsQuerySelector);
    if (!itemPaneDomNode) return false;

    // Handle Custom Third-Party Sections first
    let sections = itemPaneDomNode.querySelectorAll("item-pane-custom-section");
    let maxSortOrder = layoutItems.length + sections.length + 1;
    let sortOrder = maxSortOrder;

    this.log(`DBG: layoutItems=${layoutItems.length}, sections=${sections.length}`);

    sections.forEach(section => {
      section.style.order = sortOrder;
      sortOrder--;
      let dbg = "section ";
      if (section.id) {
        dbg += `id: ${section.id}, `;
      }
      dbg += `tagName: ${section.tagName}, sortOrder=${sortOrder}`;
      this.log(`DBG: ${dbg}`);

    });

    // Parse and Map out Core Sections using updated Zotero.Prefs.get (without localized true flag)
    var coreLayoutItems = [];
    layoutItems.forEach(key => {
      // Fetch the physical element ID string from preferences
      const idPrefKey = `extensions.zotero.zotero-layout-lab.id.${key}`;
      const targetElementId = Zotero.Prefs.get(idPrefKey);

      if (targetElementId) {
        // Preferred sort from preferences
        const orderPrefKey = `extensions.zotero.zotero-layout-lab.order.${key}`;
        const targetOrderValue = Number(Zotero.Prefs.get(orderPrefKey));
        coreLayoutItems.push({ targetElementId, targetOrderValue });
      }
    });

    // Sort descending layout rules 
    coreLayoutItems.sort((a, b) => a.targetOrderValue - b.targetOrderValue);

    // --- REPLACE FROM HERE DOWN TO THE END OF THE FUNCTION ---
    let appliedAny = false;
    coreLayoutItems.forEach(item => {
      if (!item.targetElementId) {
        this.log(`Error: no targetElementId specified!`);
      } else {
        const domNode = doc.getElementById(item.targetElementId);

        if (!domNode) {
          // This is expected sometimes on quick item shifts before DOM elements generate
          this.log(`Note: domNode not ready yet for targetElementId: ${item.targetElementId}`);
        } else {
          domNode.style.order = sortOrder;
          sortOrder--;
          appliedAny = true;
        }
      }
    });

    return appliedAny;
  },

  addToWindow(win) {
    if (!win || !win.document) return;
    const doc = win.document;

    if (win.ZoteroPane?.itemsView) {
      // Use the built-in component callback listener pipeline
      win.ZoteroPane.itemsView.onSelect.addListener(() => {
        this.log("[ZLL] Item view selection modified via onSelect pipeline.");
        this.applyFlexLayoutHack(win);
      });
    }

    if (this.activeWindows.has(win)) return;
    this.log("Binding hyper-aggressive listeners to window context.");

    // Trigger #1: High-level window selection handler
    const selectionListener = (event) => {
      this.log("TRIGGER: Selection Change Event captured via window level!");
      this.applyFlexLayoutHack(win);
    };
    win.addEventListener("select", selectionListener, true);

    // Initial structure layout pass
    this.applyFlexLayoutHack(win);

    // Trigger #2: Global Document Tree Mutation Observer (Immune to target node deletions)
    let mutationObserver = null;
    let isMutating = false;

    if (doc.documentElement) {
      mutationObserver = new win.MutationObserver((mutations) => {
        if (isMutating) return;

        // Check if the item-pane wrapper exists anywhere in the mutation sequence records
        const itemPaneJsQuerySelector = Zotero.Prefs.get("extensions.zotero.zotero-layout-lab.item-pane.js-query-selector", true);
        const paneExists = doc.querySelector(itemPaneJsQuerySelector);
        
        if (paneExists) {
          isMutating = true;
          this.log("TRIGGER: Global MutationObserver intercepted item pane layout changes.");
          this.applyFlexLayoutHack(win);
          
          // Small debounce safety window to avoid rendering loops
          win.setTimeout(() => { isMutating = false; }, 40);
        }
      });

      // Observe the root container document element—this node is never dropped or destroyed
      mutationObserver.observe(doc.documentElement, { 
        childList: true, 
        subtree: true,
        attributes: false 
      });
      this.log("Global Document MutationObserver successfully locked on root element.");
    }

    // Trigger #3: Extra fallback polling loop specifically for item shifts
    const fallbackInterval = win.setInterval(() => {
      // Fast structural verification pass to snap things back into alignment silently
      this.applyFlexLayoutHack(win);
    }, 2000);

    this.activeWindows.set(win, {
      listener: selectionListener,
      observer: mutationObserver,
      interval: fallbackInterval
    });
  },

  addToWindowOLDER(win) {
    if (!win || !win.document) return;
    const doc = win.document;

    // Prevent attaching multiple selection handlers to the exact same window
    if (this.activeWindows.has(win)) return;

    this.log("Binding selection listener directly to window context.");

    // Store the listener reference on a mapping instance or tracking object 
    // so that destroy/removeFromWindow can access the exact same function reference.
    this._selectionListener = () => {
      this.log("UI Selection Change Event Captured via itemsView.onSelect!");
      this.applyFlexLayoutHack(win);
    };

    if (win.ZoteroPane?.itemsView?.onSelect) {
      // Deduplicate any residual listeners before adding
      try {
        win.ZoteroPane.itemsView.onSelect.removeListener(this._selectionListener);
      } catch(e) {}
      
      win.ZoteroPane.itemsView.onSelect.addListener(this._selectionListener);
      this.log("Successfully bound onSelect listener wrapper.");
      
      // Run an initial structural layout pass immediately upon attaching
      this.applyFlexLayoutHack(win);
    }

    // Initial structure layout pass
    this.applyFlexLayoutHack(win);

    // Dynamic subtree MutationObserver configuration setup
    const selector = Zotero.Prefs.get("extensions.zotero.zotero-layout-lab.item-pane.js-query-selector");
    const container = doc.querySelector(selector);

    let mutationObserver = null;
    if (container) {
      mutationObserver = new win.MutationObserver((mutations) => {
        //mutationObserver.disconnect();
        this.applyFlexLayoutHack(win);
        mutationObserver.observe(container, { childList: true, subtree: true });
      });
      mutationObserver.observe(container, { childList: true, subtree: true });
      this.log("MutationObserver successfully attached to the item-pane container element.");
    } else {
      this.log("Warning: Container DOM not fully ready for MutationObserver during initial load wrapper pass.");
    }

    // Track state elements to guarantee safe runtime memory cleanup profiles
    this.activeWindows.set(win, {
      listener: this._selectionListener,
      observer: mutationObserver
    });

  },

  addToAllWindows() {
    var windows = Zotero.getMainWindows();
    for (let win of windows) {
      if (!win.ZoteroPane) continue;
      this.addToWindow(win);
    }
  },

  removeFromWindow(win) {
    if (!win || !win.document) return;
    const doc = win.document;
    
    const allSectionsInStr = Zotero.Prefs.get("extensions.zotero.zotero-layout-lab.item-pane.core-sections");
    if (!allSectionsInStr) return;

    const layoutItems = allSectionsInStr.split(",").map(s => s.trim());
    
    // Clear flex layout settings cleanly
    layoutItems.forEach(key => {
      const idPrefKey = `extensions.zotero.zotero-layout-lab.id.${key}`;
      const targetElementId = Zotero.Prefs.get(idPrefKey);
      if (targetElementId) {
        const domNode = doc.getElementById(targetElementId);
        if (domNode) domNode.style.order = "";
      }
    });

    let itemPaneJsQuerySelector = Zotero.Prefs.get("extensions.zotero.zotero-layout-lab.item-pane.js-query-selector");
    let itemPaneDomNode = doc.querySelector(itemPaneJsQuerySelector);
    if (itemPaneDomNode) {
      let sections = itemPaneDomNode.querySelectorAll("item-pane-custom-section");
      sections.forEach(section => { section.style.order = ""; });
    }
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
    this.log("Destroy called. Cleaning up observers.");
    if (this.prefObserverId) {
      Zotero.Prefs.unregisterObserver(this.prefObserverId);
      this.prefObserverId = null;
    }

    if (this.zoteroNotifierId) {
      Zotero.Notifier.unregisterObserver(this.zoteroNotifierId);
      this.zoteroNotifierId = null;
    }

    for (let [win, tracking] of this.activeWindows.entries()) {
      try {
        if (tracking.observer) {
          tracking.observer.disconnect();
        }        
        if (tracking.listener) {
          win.removeEventListener("select", tracking.listener, true);
          this.log("Successfully removed window select listener wrapper during shutdown.");
        }
        this.removeFromWindow(win);
      } catch (e) {
        this.log("Error cleaning up window tracking: " + e.message);
      }
    }
    this.activeWindows.clear();
    this.initialized = false;
  },

  async main() {
    this.log("Box Sorter Engine Subsystem Initialized Active.");
    this.execute();
  }
};