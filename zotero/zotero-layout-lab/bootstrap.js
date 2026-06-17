var ChromeHandle;
var ZoteroLayoutLab;

function log(msg) {
  Zotero.debug("[ZLL Boot] " + msg);
}

function install(data, reason) {
  log("Installed 2.0");
}

async function startup({ id, version, resourceURI, rootURI }, reason) {
  log(
    "STARTUP id:" +
      id +
      ", version:" +
      version +
      ", resourceURI:" +
      resourceURI +
      ", rootURI:" +
      rootURI +
      ", reason:" +
      reason,
  );

  var aomStartup = Components.classes[
    "@mozilla.org/addons/addon-manager-startup;1"
  ].getService(Components.interfaces.amIAddonManagerStartup);

  var manifestURI = Services.io.newURI(rootURI + "manifest.json");

  this.ChromeHandle = aomStartup.registerChrome(manifestURI, [
    ["content", "zotero-layout-lab", "chrome/content/"],
  ]);

  /**
   * Global variables for plugin code.
   * The `_globalThis` is the global root variable of the plugin sandbox environment
   * and all child variables assigned to it is globally accessible.
   * See `src/index.ts` for details.
   */
  const ctx = {
    rootURI,
    Zotero,
  };
  ctx._globalThis = ctx;

  Services.scriptloader.loadSubScript(
    rootURI + "/chrome/content/src/ZLLAnnotationManager.js",
    ctx,
  );
  Services.scriptloader.loadSubScript(
    rootURI + "/chrome/content/src/ZLLBoxSorter.js",
    ctx,
  );
  Services.scriptloader.loadSubScript(
    rootURI + "/chrome/content/src/ZoteroLayoutLab.js",
    ctx,
  );

  // Extract properties cleanly checking both sandbox reference scopes safely
  let managerInstance = ctx.ZLLAnnotationManagerObj || ctx._globalThis.ZLLAnnotationManagerObj;
  let sorterInstance = ctx.ZLLBoxSorterObj || ctx._globalThis.ZLLBoxSorterObj;
  ZoteroLayoutLab = ctx.ZoteroLayoutLab || ctx._globalThis.ZoteroLayoutLab;

  if (!ZoteroLayoutLab) {
    throw new Error(
      "[ZLL] Failed to resolve master ZoteroLayoutLab module from evaluation sandbox.",
    );
  }

  ZoteroLayoutLab.init({ id, version, rootURI }, managerInstance, sorterInstance);
  await ZoteroLayoutLab.main();

  Zotero.PreferencePanes.register({
    pluginID: "zotero-layout-lab@ari.takku.fi", // Must match manifest id exactly
    src: "chrome://zotero-layout-lab/content/preferences.xhtml",
    scripts: ["chrome://zotero-layout-lab/content/preferences.js"],
  });
}

async function onMainWindowLoad({ window }, reason) {
  if (ZoteroLayoutLab) ZoteroLayoutLab.addToWindow(window);
}

async function onMainWindowUnload({ window }, reason) {
  if (ZoteroLayoutLab) ZoteroLayoutLab.removeFromWindow(window);
}

async function shutdown({ id, version, resourceURI, rootURI }, reason) {
  if (reason === APP_SHUTDOWN) return;

  if (ChromeHandle) {
    ChromeHandle.destruct();
    ChromeHandle = null;
  }

  log("Shutting down cleanly");

  if (ZoteroLayoutLab) {
    ZoteroLayoutLab.destroy();
  }
  this.ZoteroLayoutLab = undefined;
}

async function uninstall(data, reason) {
  log("Uninstalled 2.0");
}
