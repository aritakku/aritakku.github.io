# Working ways

## Rename annotation colors

Use dedicated plugin:

https://github.com/aidecameron/zotero-annotation-color-customizer


Download source, edit manifest.json:
```
{
  "manifest_version": 2,
  "name": "Annotation Color Customizer (arihack -> zotero 9.x)",
  "version": "1.1.2.1",
  "description": "Customize annotation color tooltips and right-click menu translations in Zotero 7",
  "homepage_url": "https://github.com/aidecameron/zotero-annotation-color-customizer",
  "author": "aidecameron",
  "applications": {
    "zotero": {
      "id": "annotation-color-customizer@aidecameron.github.io",
      "update_url": "https://github.com/aidecameron/zotero-annotation-color-customizer/releases/latest/download/updates.json",
      "strict_min_version": "6.999",
      "strict_max_version": "10.0.*"
    }
  },
  "icons": {
    "16": "icons/icon-16.svg",
    "32": "icons/icon-32.svg",
    "48": "icons/icon-48.svg",
    "96": "icons/icon-96.svg"
  }
}
```

Pack the xpi with these bash commands:

```
# fix file
sudo apt install dos2unix
dos2unix build.sh

# give permissions
chmod u+x build.sh

# check that exists
ls -l /bin/bash

# check that file has decent encoding
file build.sh

# build
./build.sh
```

Open Zotero, install plugin, edit settings per annotation protocol. New values are stored in profile prefs:

```
/mnt/c/Users/Takku/AppData/Roaming/Zotero/Zotero/Profiles/rn310doe.default/prefs.js:user_pref("extensions.zotero.extensions.annotationColorCustomizer.colorConfig", "{\"yellow\":{\"hex\":\"#ffd400\",\"name\":\"Context (General narrative and supporting background)\"},\"red\":{\"hex\":\"#ff6666\",\"name\":\"Dispute (Gaps, Limitations, and \\\"The Opponent's\\\" claims)\"},\"green\":{\"hex\":\"#5fb236\",\"name\":\"Evidence (Findings, P-Values, and Qualitative Results)\"},\"blue\":{\"hex\":\"#2ea8e5\",\"name\":\"Theory (Theoretical Frameworks, Models, and Lenses)\"},\"purple\":{\"hex\":\"#a28ae5\",\"name\":\"Definition (Terminology, Taxonomies, and Semantic Anchors)\"},\"magenta\":{\"hex\":\"#e56eee\",\"name\":\"Gold (High-impact quotes / Foundational core)\"},\"orange\":{\"hex\":\"#f19837\",\"name\":\"Method (Protocols, Study Designs, and Implementation)\"},\"gray\":{\"hex\":\"#aaaaaa\",\"name\":\"Logistic (Citations to follow up: Bibliography mining)\"}}");

/mnt/c/Users/Takku/AppData/Roaming/Zotero/Zotero/Profiles/rn310doe.default/prefs.js:user_pref("extensions.zotero.extensions.annotationColorCustomizer.colorConfig", "{\"yellow\":{\"hex\":\"#ffd400\",\"name\":\"Context\"},\"red\":{\"hex\":\"#ff6666\",\"name\":\"Dispute\"},\"green\":{\"hex\":\"#5fb236\",\"name\":\"Evidence\"},\"blue\":{\"hex\":\"#2ea8e5\",\"name\":\"Theory\"},\"purple\":{\"hex\":\"#a28ae5\",\"name\":\"Definition\"},\"magenta\":{\"hex\":\"#e56eee\",\"name\":\"Gold\"},\"orange\":{\"hex\":\"#f19837\",\"name\":\"Method\"},\"gray\":{\"hex\":\"#aaaaaa\",\"name\":\"Logistic\"}}");
```

## Miscellaneous

Run Zotero with debug

`& "C:\Program Files\Zotero\zotero.exe" -purgecaches -ZoteroDebugText -jsconsole -jsdebugger`

Structures, etc for annotation HTML

```
html body.sidebar-open div#reader-ui div.split-view div.primary-view div.view-popup.selection-popup.page-popup-bottom-center

/html/body/div[1]/div[2]/div[1]/div[2]
```

Bypass PowerShell's GUI background process absorption rules

`cmd.exe /c `"C:\Program Files\Zotero\zotero.exe`" -ZoteroDebugText -jsconsole -jsdebugger`

Dirs

``` 
C:\Users\Takku\AppData\Roaming\Zotero\Zotero\Profiles

C:\Users\Takku\AppData\Roaming\Zotero\Zotero\Profiles\rn310doe.default

C:\Users\Takku\AppData\Roaming\Python\Python314\Scripts
```

### URIS

https://github.com/aritakku/aritakku.github.io.git

https://www.zotero.org/support/dev/client_coding/plugin_development#setting_up_a_plugin_development_environment

https://github.com/zotero/make-it-red

https://www.zotero.org/support/dev/sample_plugin

https://github.com/orgs/zotero/repositories?type=all


pluginin refresh nudge: (do not work)

zotero > tools > run javascript
```
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
```