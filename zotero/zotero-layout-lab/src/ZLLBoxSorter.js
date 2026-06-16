class ZLLBoxSorter {
  /* ==============================================================================
     RIGHT-HAND SIDE PANEL TAG SORTING (FLEXBOX OVERRIDE)
     ============================================================================== */
  constructor() {
    this.sectionId = "zll-box-sorter-section";
    this.openLayoutObservers = new Map();
    this._windowListenerId = null;
    this._ww = null;
    this.verifiedTagsBoxId = "zotero-editpane-tags";
    this.verifiedInfoBoxId = "zotero-editpane-info-box";
  }

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
  }

  register() {
    const windows = Zotero.getMainWindows();
    for (let win of windows) {
      if (win.ZoteroPane) {
        this.applyFlexLayoutHack(win);
      }
    }

    // Set up cross-window listener callbacks using native Mozilla interfaces
    this._windowWatcherCallback = (win) => {
      win.addEventListener(
        "load",
        () => {
          if (win.ZoteroPane) {
            this.applyFlexLayoutHack(win);
          }
        },
        { once: true },
      );
    };

    this._ww = Components.classes[
      "@mozilla.org/embedcomp/window-watcher;1"
    ].getService(Components.interfaces.nsIWindowWatcher);
    this._ww.registerNotification(this._windowWatcherCallback);
  }

  unregister() {
    if (this._ww && this._windowWatcherCallback) {
      this._ww.unregisterNotification(this._windowWatcherCallback);
    }

    // Clear intervals cleanly to prevent context memory leakage
    for (let [win, intervalId] of this.openLayoutObservers.entries()) {
      win.clearInterval(intervalId);
    }
    this.openLayoutObservers.clear();
  }
}

// Expose safely to bootstrap runtime context
globalThis.ZLLBoxSorter = ZLLBoxSorter;
