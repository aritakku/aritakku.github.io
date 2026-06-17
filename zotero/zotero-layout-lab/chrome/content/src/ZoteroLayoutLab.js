this.ZoteroLayoutLab = {
  ZOTERO_ID: "zotero-layout-lab@ari.takku.fi",
  id: null,
  version: null,
  rootURI: null,
  initialized: false,

  ZLLAnnotationManager: null,
  ZLLBoxSorter: null,

  init({ id, version, rootURI }, managerInstance, sorterInstance) {
    if (this.initialized) return;
    this.id = id;
    this.version = version;
    this.rootURI = rootURI;

    this.ZLLAnnotationManager = managerInstance;
    this.ZLLBoxSorter = sorterInstance;

    this.ZLLAnnotationManager.init({ id, version, rootURI }); 
    this.ZLLBoxSorter.init({ id, version, rootURI });
 
    this.initialized = true;
  },

  log(msg) {
    Zotero.debug("[ZLL MASTER]: " + msg);
  },

  checkPropsExist() {
    var ok = true;
    // Initialize sub-managers safely
    if (!this.ZLLAnnotationManager) { 
      this.log("ERROR: No ZLLAnnotationManager");
      ok = false;
    }

    if (!this.ZLLBoxSorter) {      
      this.log("ERROR: No ZLLBoxSorter");
      ok = false;
    }
    return ok;
  },

  execute() {
    if (this.checkPropsExist()) {
      this.ZLLAnnotationManager.execute();
      this.ZLLBoxSorter.execute();
    } else {
      this.log("ERROR: Could not execute.");
    }
  },

  destroy() {
    if (this.ZLLAnnotationManager) {
      this.ZLLAnnotationManager.destroy();
    }
    if (this.ZLLBoxSorter) {
      this.ZLLBoxSorter.destroy();
    }
    this.ZLLAnnotationManager = undefined;
    this.ZLLBoxSorter = undefined;
    this.initialized = false;
  },

  async main() {
    if (this.checkPropsExist()) {
      await this.ZLLAnnotationManager.main();
      await this.ZLLBoxSorter.main();  
    } else {
      this.log("ERROR: Could not execute.");
    }
  },

  async onMainWindowLoad({ window }, reason) {
    if (this.ZLLAnnotationManager) this.ZLLAnnotationManager.addToWindow(window);
    if (this.ZLLBoxSorter) this.ZLLBoxSorter.addToWindow(window);
  },

  async onMainWindowUnload({ window }, reason) {
    if (this.ZLLAnnotationManager) this.ZLLAnnotationManager.removeFromWindow(window);
    if (this.ZLLBoxSorter) this.ZLLBoxSorter.removeFromWindow(window);
  },

  /* ==============================================================================
     MASTER APPLICATION WINDOW ROUTERS (Bound directly from bootstrap hooks)
     ============================================================================== */
  addToWindow(window) {
    if (this.ZLLAnnotationManager) this.ZLLAnnotationManager.addToWindow(window);
    if (this.ZLLBoxSorter) this.ZLLBoxSorter.addToWindow(window);
  },

  removeFromWindow(window) {
    if (this.ZLLAnnotationManager) this.ZLLAnnotationManager.removeFromWindow(window);
    if (this.ZLLBoxSorter) this.ZLLBoxSorter.removeFromWindow(window);
  }
};
