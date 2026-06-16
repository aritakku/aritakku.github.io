var chromeHandle;
var annotationManager;
var boxSorter;

function install(data, reason) {}

async function startup({ id, version, resourceURI, rootURI }, reason) {
  // 1. Load the payload schema structure first
  Services.scriptloader.loadSubScript(`${rootURI}lib/ZLLAnnotationSchema.js`);

  // 2. Load the structural managers
  Services.scriptloader.loadSubScript(`${rootURI}src/ZLLAnnotationManager.js`);
  Services.scriptloader.loadSubScript(`${rootURI}src/ZLLBoxSorter.js`);

  // 3. Both classes are now structural globals, initialize safely
  annotationManager = new ZLLAnnotationManager();
  annotationManager.register();

  boxSorter = new ZLLBoxSorter();
  boxSorter.register();
}

async function shutdown({ id, version, resourceURI, rootURI }, reason) {
  if (reason === APP_SHUTDOWN) {
    return;
  }

  if (annotationManager) {
    annotationManager.unregister();
    annotationManager = null;
  }

  if (boxSorter) {
    boxSorter.unregister();
    boxSorter = null;
  }
}

async function uninstall(data, reason) {}

/*
import { ZLLAnnotationManager } from "./src/ZLLAnnotationManager.js";
import { ZLLBoxSorter } from "./src/ZLLBoxSorter.js";

let annotationManager;
let boxSorter;

export function startup() {
  // Executed when Zotero 9 fully wakes your plugin instance
  annotationManager = new ZLLAnnotationManager();
  annotationManager.register();

  boxSorter = new ZLLBoxSorter();
  boxSorter.register();
}

export function shutdown() {
  // Cleanly remove components to avoid memory leaks or dangling layout structures on disable
  if (annotationManager) {
    annotationManager.unregister();
  }

  if (boxSorter) {
    boxSorter.unregister();
  }
}

export function install() {
  // Executed on initial plugin installation
}

export function uninstall() {
  // Executed when removing the plugin entirely
}
*/
