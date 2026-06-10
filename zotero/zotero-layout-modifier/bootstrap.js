function startup({ id, version, rootURI }) {
    Zotero.debug("[RIGHT-PANEL SORT ADDON] Starting");

    Zotero.uiReadyPromise.then(() => {
        for (let win of Zotero.getMainWindows()) {
            applyFlexLayoutHack(win);
        }
    });
}

function shutdown() {
    Zotero.debug("[RIGHT-PANEL SORT ADDON] Shutdown");
}

function install() {}
function uninstall() {}

function applyFlexLayoutHack(win) {
    let doc = win.document;

    let observer = new win.MutationObserver(() => {
        let tagsBox = doc.getElementById("zotero-editpane-tags");
        let infoBox = doc.getElementById("zotero-editpane-info-box");

        if (tagsBox && infoBox) {
            tagsBox.style.order = "-2";
            infoBox.style.order = "-1";

            observer.disconnect();
            Zotero.debug("[RIGHT-PANEL SORT ADDON] Panels reordered");
        }
    });

    observer.observe(doc, { childList: true, subtree: true });
}