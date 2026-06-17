ZoteroLayoutLab = {
  ZOTERO_ID: "zotero-layout-lab@ari.takku.fi",
  id: null,
  version: null,
  rootURI: null,
  initialized: false,

  ZLLAnnotationManager: null,
  ZLLBoxSorter: null,

  init({ id, version, rootURI }, managerInstance, sorterInstance) {
    this.log(`DBG: init id:${id}, version:${version}`);
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


  execute() {
    this.log(`DBG: execute`);
      this.ZLLAnnotationManager.execute();
      this.ZLLBoxSorter.execute();
  },

  destroy() {
    this.log(`DBG: destroy`);
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
      this.log(`DBG: await main`);

      await this.ZLLAnnotationManager.main();
      await this.ZLLBoxSorter.main();  
  },

  async onMainWindowLoad({ window }, reason) {
    this.log(`DBG: onMainWindowLoad`);
    this.ZLLAnnotationManager.addToWindow(window);
    this.ZLLBoxSorter.addToWindow(window);
  },

  async onMainWindowUnload({ window }, reason) {
    this.log(`DBG: onMainWindowUnLoad`);
    this.ZLLAnnotationManager.removeFromWindow(window);
    this.ZLLBoxSorter.removeFromWindow(window);
  },

  /* ==============================================================================
     MASTER APPLICATION WINDOW ROUTERS (Bound directly from bootstrap hooks)
     ============================================================================== */
  addToWindow(window) {
    this.log(`DBG: addToWindow`);
    this.ZLLAnnotationManager.addToWindow(window);
    this.ZLLBoxSorter.addToWindow(window);
  },

  removeFromWindow(window) {
    this.log(`DBG: removeFromWindow`);
    this.ZLLAnnotationManager.removeFromWindow(window);
    this.ZLLBoxSorter.removeFromWindow(window);
  }
};
