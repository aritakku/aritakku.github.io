/* ==============================================================================
   GLOBAL CONFIGURATION & COMPONENT TRACKING REGISTRIES
   ============================================================================== */
const DEBUG = true;

// Registry vectors to catch instances for clean garbage collection on shutdown
const openLayoutObservers = new Map();
const openColorObservers = new Map();

function log(msg) {
  if (DEBUG) Zotero.debug(`[ACADEMIC-DECK] ${msg}`);
}

const COLOR_PROTOCOL = {
  "general.yellow": {
    label: "CONTEXT: General narrative / background",
    hex: "#ffd400",
  },
  "general.red": {
    label: "DISPUTE: Gaps, limitations, or opposing claims",
    hex: "#ff6666",
  },
  "general.green": { label: "EVIDENCE: Findings, results", hex: "#5fb236" },
  "general.blue": { label: "THEORY: Frameworks, models", hex: "#2ea8e5" },
  "general.purple": { label: "DEFINITION: Terminology", hex: "#a28ae5" },
  "general.magenta": { label: "GOLD: Core insights", hex: "#e56eee" },
  "general.orange": { label: "METHOD: Study design", hex: "#f19837" },
  "general.gray": { label: "LOGISTIC: Citations to trace", hex: "#aaaaaa" },
};

/* ==============================================================================
   COLOR PROTOCOL MANAGEMENT MODULE
   ============================================================================== */
function injectTooltips(root) {
  if (!root || !root.querySelectorAll) return;

  const buttons = root.querySelectorAll("button.color-button");
  if (!buttons.length) return;

  log(`[COLOR] Found ${buttons.length} color buttons`);

  // Optimized high-efficiency loop cache
  for (let b = 0; b < buttons.length; b++) {
    const btn = buttons[b];
    const key = btn.getAttribute("title");
    const rule = COLOR_PROTOCOL[key];
    if (!rule) continue;

    btn.setAttribute("title", rule.label);
    btn.setAttribute("aria-label", rule.label);
    btn.style.cursor = "pointer";

    if (!btn.dataset.cpBound) {
      btn.addEventListener("mouseenter", () => {
        btn.style.outline = `2px solid ${rule.hex}`;
        btn.style.outlineOffset = "2px";
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.outline = "none";
      });

      btn.dataset.cpBound = "1";
    }
  }
}

function attachColorObserver(doc, label, win) {
  if (!doc || !doc.body) {
    log(`[COLOR] Skipped invalid doc (${label})`);
    return;
  }

  // Prevent duplicate observer layouts safely
  if (doc._cpObserver) {
    try {
      doc._cpObserver.disconnect();
    } catch (e) {}
    log(`[COLOR] Existing observer disconnected (${label})`);
  }

  // Run immediate validation check
  injectTooltips(doc);

  const observer = new doc.defaultView.MutationObserver((mutations) => {
    for (let m = 0; m < mutations.length; m++) {
      const addedNodes = mutations[m].addedNodes;
      for (let n = 0; n < addedNodes.length; n++) {
        const node = addedNodes[n];
        if (node.nodeType !== 1) continue;

        if (
          node.classList?.contains("view-popup") ||
          (typeof node.querySelector === "function" &&
            node.querySelector(".colors"))
        ) {
          log("[COLOR] Popup detected → injecting custom tooltips");
          injectTooltips(node);
        }
      }
    }
  });

  try {
    observer.observe(doc.body, { childList: true, subtree: true });
    doc._cpObserver = observer;

    // Catalog inside global collection instance array maps
    if (!openColorObservers.has(win)) {
      openColorObservers.set(win, []);
    }
    openColorObservers.get(win).push({ doc: doc, observer: observer });

    log(`[COLOR] Observer attached successfully → ${label}`);
  } catch (err) {
    log(
      `[COLOR ERROR] Failed attaching observer to context ${label}: ${err.message}`,
    );
  }
}

function applyColorProtocol(win) {
  if (!win || !win.document) {
    log("[COLOR] Invalid target window frame context object reference");
    return;
  }

  try {
    // 1. Root main layout layer document
    attachColorObserver(win.document, "Main Window", win);

    // 2. Tab interface iframe traversal loop sweep
    const frames = win.document.querySelectorAll("iframe, browser");
    log(
      `[COLOR] Processing ${frames.length} embedded tabs / sub-frame documents`,
    );

    let hooked = 0;
    for (let i = 0; i < frames.length; i++) {
      try {
        const contentDoc = frames[i].contentDocument;
        if (contentDoc) {
          attachColorObserver(
            contentDoc,
            `Embedded Frame Layer Slot #${i}`,
            win,
          );
          hooked++;
        }
      } catch (e) {
        log(
          `[COLOR] Embedded frame context index [${i}] currently inaccessible`,
        );
      }
    }
    log(
      `[COLOR] Successfully connected ${hooked}/${frames.length} total active views`,
    );
  } catch (e) {
    log(`[COLOR CRITICAL EXCEPTION] Error navigating frame trees: ${e}`);
  }
}

/* ==============================================================================
   PANEL SORT DESIGN MODULE
   ============================================================================== */
function applyFlexLayoutHack(win) {
  if (!win || !win.document) {
    log("[LAYOUT] Invalid window target structure.");
    return;
  }

  const doc = win.document;

  function tryApply() {
    const tagsBox = doc.getElementById("zotero-editpane-tags");
    const infoBox = doc.getElementById("zotero-editpane-info-box");

    if (tagsBox && infoBox) {
      tagsBox.style.order = "-2";
      infoBox.style.order = "-1";
      log("[LAYOUT] Panels reordered cleanly.");
      return true;
    }
    return false;
  }

  // Attempt instant application sequence
  if (tryApply()) {
    log("[LAYOUT] Applied immediately via raw memory lookup pass.");
    try {
      applyColorProtocol(win);
    } catch (e) {
      log("[COLOR] Error: " + e);
    }
    return;
  }

  // Backoff layout observer mapping layer logic
  if (openLayoutObservers.has(win)) {
    try {
      openLayoutObservers.get(win).disconnect();
    } catch (e) {}
  }

  let attempts = 0;
  const layoutObserver = new win.MutationObserver(() => {
    attempts++;

    if (tryApply()) {
      layoutObserver.disconnect();
      openLayoutObservers.delete(win);
      log(
        `[LAYOUT] Applied via observer after ${attempts} layout mutation changes.`,
      );

      try {
        applyColorProtocol(win);
      } catch (e) {
        log("[COLOR] Failure inside observer callback thread: " + e);
      }
    } else if (attempts % 25 === 0) {
      log(
        `[LAYOUT] Waiting on system node layout paint cycles... (Attempts: ${attempts})`,
      );
    }
  });

  try {
    layoutObserver.observe(doc, { childList: true, subtree: true });
    openLayoutObservers.set(win, layoutObserver);
    log("[LAYOUT] MutationObserver attached to document structure.");
  } catch (e) {
    log(`[LAYOUT CRITICAL ERROR] Binding observer failed: ${e.message}`);
  }
}

/* ==============================================================================
   SYSTEM LIFE-CYCLE MANIFEST OPERATIONS
   ============================================================================== */
function startup({ id, version, rootURI }) {
  log(`[BOOT] Initializing system workspace layout plugin v${version}`);

  Zotero.uiReadyPromise.then(() => {
    log("[BOOT] UI mapping layers completely populated.");

    const windowsList = Zotero.getMainWindows();
    log(`[BOOT] Detected ${windowsList.length} independent window contexts.`);

    for (let w = 0; w < windowsList.length; w++) {
      const activeWindow = windowsList[w];
      // 100ms async timing separation gap step to let complex templates render safely inside desktop RAM
      activeWindow.setTimeout(() => {
        log(`[BOOT] Executing modifiers on window instance slot #${w}`);
        applyFlexLayoutHack(activeWindow);
      }, 100);
    }
  });
}

function shutdown() {
  log("[BOOT] Shutdown sequence initiated. Cleaning execution hooks.");

  // 1. Terminate and clear all layout observers
  log(
    `[CLEANUP] Disconnecting ${openLayoutObservers.size} active main panel observers.`,
  );
  for (let [win, observer] of openLayoutObservers.entries()) {
    try {
      observer.disconnect();
    } catch (e) {}
  }
  openLayoutObservers.clear();

  // 2. Terminate and clear color tab annotation document observers
  log("[CLEANUP] Disconnecting all embedded document observers across frames.");
  for (let [win, trackingVector] of openColorObservers.entries()) {
    trackingVector.forEach((entry) => {
      try {
        entry.observer.disconnect();
        if (entry.doc && entry.doc._cpObserver) {
          delete entry.doc._cpObserver;
        }
      } catch (e) {}
    });

    // 3. Gracefully reset CSS flex elements back to native application standards
    try {
      const doc = win.document;
      if (doc) {
        const tags = doc.getElementById("zotero-editpane-tags");
        const info = doc.getElementById("zotero-editpane-info-box");
        if (tags) tags.style.order = "";
        if (info) info.style.order = "";
      }
    } catch (e) {}
  }
  openColorObservers.clear();

  log("[BOOT] Clean workspace shutdown completed successfully.");
}

function install() {
  log("[BOOT] Workspace extension install complete.");
}
function uninstall() {
  log("[BOOT] Workspace extension completely removed.");
}
