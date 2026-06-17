var ChromeHandle;
var ZLLAnnotationManager;
var ZLLBoxSorter;

function log(msg) {
  Zotero.debug("[ZLL] " + msg);
}

function install(data, reason) {
  log("Installed 2.0");
}

async function startup({ id, version, rootURI }, reason) {
  log("Starting 2.0");

  var aomStartup = Components.classes[
    "@mozilla.org/addons/addon-manager-startup;1"
  ].getService(Components.interfaces.amIAddonManagerStartup);

  var manifestURI = Services.io.newURI(rootURI + "manifest.json");
  ChromeHandle = aomStartup.registerChrome(manifestURI, [
    ["content", "zotero-layout-lab", rootURI + "chrome/content/"],
  ]);

  Zotero.PreferencePanes.register({
    pluginID: "zotero-layout-lab@ari.takku.fi", // Must match manifest id exactly
    src: rootURI + "preferences.xhtml",
    scripts: [rootURI + "preferences.js"],
  });

  // 1. Load the payload schema structure first
  //Services.scriptloader.loadSubScript(rootURI + "lib/ZLLAnnotationSchema.js");

  // 2. Load the structural managers
  Services.scriptloader.loadSubScript(rootURI + "src/ZLLAnnotationManager.js");
  Services.scriptloader.loadSubScript(rootURI + "src/ZLLBoxSorter.js");

  // 3. Both classes are now structural globals, initialize safely

  ZLLAnnotationManager.init({ id, version, rootURI });
  ZLLAnnotationManager.execute();
  await ZLLAnnotationManager.main();

  ZLLBoxSorter.init({ id, version, rootURI });
  ZLLBoxSorter.execute();
  await ZLLBoxSorter.main();
}

function onMainWindowLoad({ window }) {
  ZLLAnnotationManager.addToWindow(window);
  ZLLBoxSorter.addToWindow(window);
}

function onMainWindowUnload({ window }) {
  ZLLAnnotationManager.removeFromWindow(window);
  ZLLBoxSorter.removeFromWindow(window);
}

function shutdown() {
  log("Shutting down 2.0");
  ZLLAnnotationManager.removeFromAllWindows();
  ZLLAnnotationManager = undefined;
  ZLLBoxSorter = undefined;
}

function uninstall() {
  log("Uninstalled 2.0");
}
