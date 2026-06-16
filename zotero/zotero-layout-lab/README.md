& "C:\Program Files\Zotero\zotero.exe" -ZoteroDebugText -jsconsole -jsdebugger

html body.sidebar-open div#reader-ui div.split-view div.primary-view div.view-popup.selection-popup.page-popup-bottom-center

/html/body/div[1]/div[2]/div[1]/div[2]

# Bypasses PowerShell's GUI background process absorption rules
cmd.exe /c `"C:\Program Files\Zotero\zotero.exe`" -ZoteroDebugText -jsconsole -jsdebugger

C:\Users\Takku\AppData\Roaming\Zotero\Zotero\Profiles

C:\Users\Takku\AppData\Roaming\Zotero\Zotero\Profiles\rn310doe.default


C:\Users\Takku\AppData\Roaming\Python\Python314\Scripts


 https://github.com/aritakku/aritakku.github.io.git



pluginin refresh nudge: 

zotero > tools > run javascript

(() => {
    (async () => {
        try {
            const { AddonManager } = ChromeUtils.importESModule(
                "resource://gre/modules/AddonManager.sys.mjs"
            );
            
            let id = "zotero-layout-lab@ari.takku.fi";
            let addon = await AddonManager.getAddonByID(id);
            
            if (addon) {
                await addon.reload();
                Zotero.debug("[Dev System] Force-reloaded successfully from source!");
            } else {
                Zotero.debug("[Dev System] Addon ID not found.");
            }
        } catch (e) {
            Zotero.debug("[Dev System] Reload exception: " + e.toString());
        }
    })();
    
    // Explicitly return a blank value to prevent the RunJS window 
    // from attempting a "viewSource" lookup on an output string string
    return null;
})();