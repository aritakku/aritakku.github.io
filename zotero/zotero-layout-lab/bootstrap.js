/* ==============================================================================
   GLOBAL CONFIGURATION & COMPONENT TRACKING REGISTRIES
   ============================================================================== */
const DEBUG = true;

const openLayoutObservers = new Map();
const openColorObservers = new Map();
const activeTabListeners = new Map();

function log(msg) {
  if (DEBUG) {
    // This routes to Zotero's internal Help -> View Log
    Zotero.debug(`[ACADEMIC-DECK] ${msg}`);

    // This forces it into your open Browser Console window natively!
    if (typeof console !== "undefined" && console.log) {
      console.log(
        `%c[ACADEMIC-DECK]%c ${msg}`,
        "color: #ffd400; font-weight: bold;",
        "color: default;",
      );
    }
  }
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
   COLOR PROTOCOL MANAGEMENT MODULE (ANTI-LOCALIZATION OVERRIDE)
   ============================================================================== */
function injectTooltips(root) {
  if (!root || !root.querySelectorAll) return;

  const buttons = root.querySelectorAll("button.color-button");
  if (!buttons.length) return;

  for (let b = 0; b < buttons.length; b++) {
    const btn = buttons[b];

    // Read the primary string token right out of the fluent dataset metadata if available
    const nativeTitle =
      btn.getAttribute("title") || btn.getAttribute("data-l10n-id") || "";

    // Normalize string identifiers (handles potential trailing localization keys)
    let matchedKey = null;
    if (COLOR_PROTOCOL[nativeTitle]) {
      matchedKey = nativeTitle;
    } else {
      // Alternate fallback check for custom localization formats
      for (let key in COLOR_PROTOCOL) {
        if (nativeTitle.includes(key)) {
          matchedKey = key;
          break;
        }
      }
    }

    const rule = COLOR_PROTOCOL[matchedKey];
    if (!rule) continue;

    btn.style.cursor = "pointer";

    // Dynamic Intercept: Overwrite attributes right on hover to defeat Fluent updates
    if (!btn.dataset.cpBound) {
      btn.addEventListener("mouseenter", () => {
        // Enforce the custom protocol string right before the browser renders the tooltip bubble
        btn.setAttribute("title", rule.label);
        btn.setAttribute("aria-label", rule.label);

        btn.style.outline = `2px solid ${rule.hex}`;
        btn.style.outlineOffset = "2px";
        log(`[INTERCEPT] Enforced academic label on hover: ${matchedKey}`);
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.outline = "none";
      });

      btn.dataset.cpBound = "1";
    }
  }
}

function attachColorObserver(doc, label, win) {
  if (!doc || !doc.body) return;

  if (doc._cpObserver) {
    try {
      doc._cpObserver.disconnect();
    } catch (e) {}
  }

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
          injectTooltips(node);
        }
      }
    }
  });

  try {
    observer.observe(doc.body, { childList: true, subtree: true });
    doc._cpObserver = observer;

    if (!openColorObservers.has(win)) {
      openColorObservers.set(win, []);
    }
    openColorObservers.get(win).push({ doc: doc, observer: observer });
  } catch (err) {
    log(
      `[COLOR ERROR] Failed attaching observer to context ${label}: ${err.message}`,
    );
  }
}

function applyColorProtocol(win) {
  if (!win || !win.document) return;

  try {
    attachColorObserver(win.document, "Main Window", win);

    const frames = win.document.querySelectorAll("iframe, browser");
    for (let i = 0; i < frames.length; i++) {
      try {
        const contentDoc = frames[i].contentDocument;
        if (contentDoc) {
          attachColorObserver(
            contentDoc,
            `Embedded Frame Layer Slot #${i}`,
            win,
          );
        }
      } catch (e) {}
    }
  } catch (e) {
    log(`[COLOR CRITICAL EXCEPTION] Error navigating frame trees: ${e}`);
  }
}

/* ==============================================================================
   PANEL SORT DESIGN MODULE
   ============================================================================= */
function applyFlexLayoutHack(win) {
  if (!win || !win.document) return;
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

  if (tryApply()) return;

  if (openLayoutObservers.has(win)) {
    try {
      openLayoutObservers.get(win).disconnect();
    } catch (e) {}
  }

  const layoutObserver = new win.MutationObserver(() => {
    if (tryApply()) {
      layoutObserver.disconnect();
      openLayoutObservers.delete(win);
    }
  });

  try {
    layoutObserver.observe(doc, { childList: true, subtree: true });
    openLayoutObservers.set(win, layoutObserver);
  } catch (e) {
    log(`[LAYOUT CRITICAL ERROR] Binding observer failed: ${e.message}`);
  }
}

/* ==============================================================================
   DYNAMIC TAB ACTIVATION MONITOR (RACE CONDITION FIX)
   ============================================================================= */
function listenToTabChanges(win) {
  const doc = win.document;
  if (!doc || !doc.body) return;

  const globalSelectionTrigger = () => {
    applyColorProtocol(win);
  };
  doc.body.addEventListener("mouseup", globalSelectionTrigger, false);

  const mainUiObserver = new win.MutationObserver(() => {
    const freshFrames = doc.querySelectorAll("iframe, browser");
    let unhookedFrameFound = false;

    freshFrames.forEach((frame) => {
      try {
        if (frame.contentDocument && !frame.contentDocument._cpObserver) {
          unhookedFrameFound = true;
        }
      } catch (e) {}
    });

    if (unhookedFrameFound) {
      win.setTimeout(() => applyColorProtocol(win), 350);
    }
  });

  mainUiObserver.observe(doc.body, { childList: true, subtree: true });
  activeTabListeners.set(win, {
    observer: mainUiObserver,
    doc: doc,
    fallback: globalSelectionTrigger,
  });

  applyColorProtocol(win);
}

/* ==============================================================================
   SYSTEM LIFECYCLE OPERATIONS
   ============================================================================== */
function startup({ id, version, rootURI }) {
  Zotero.debug(
    `[BOOT] Initializing system workspace layout plugin v${version}`,
  );

  Zotero.uiReadyPromise.then(() => {
    for (let win of Zotero.getMainWindows()) {
      win.setTimeout(() => {
        applyFlexLayoutHack(win);
        listenToTabChanges(win);
      }, 150);
    }
  });
}

function shutdown() {
  log("[BOOT] Shutdown sequence initiated. Cleaning execution hooks.");

  for (let [win, observer] of openLayoutObservers.entries()) {
    try {
      observer.disconnect();
    } catch (e) {}
  }
  openLayoutObservers.clear();

  for (let [win, targetObj] of activeTabListeners.entries()) {
    try {
      targetObj.observer.disconnect();
      targetObj.doc.body.removeEventListener(
        "mouseup",
        targetObj.fallback,
        false,
      );
    } catch (e) {}
  }
  activeTabListeners.clear();

  for (let [win, trackingVector] of openColorObservers.entries()) {
    trackingVector.forEach((entry) => {
      try {
        entry.observer.disconnect();
        if (entry.doc && entry.doc._cpObserver) {
          delete entry.doc._cpObserver;
        }
      } catch (e) {}
    });

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

function install() {}
function uninstall() {}
