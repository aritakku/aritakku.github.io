class ZLLAnnotationManager {
  constructor() {
    this.sectionId = "zll-annotation-section-id";
    this._readerListenerIds = []; // <-- array to track active event listeners
  }

  register() {
    // Native Zotero 9 ItemPane registration context
    Zotero.ItemPaneManager.registerSection({
      id: this.sectionId,
      //paneID: "zll-annotation-pane-id",
      paneID: "annotation",
      pluginID: "zotero-layout-lab@ari.takku.fi", // Must match manifest id exactly
      header: {
        l10nID: "general.optional",
        icon: "icons/zll-logo-128x.png",
      },
      sidenav: {
        l10nID: "zll-annotation-sidenav", // Must inject the corresponding `ftl` file
        icon: "icons/zll-logo-128x.png",
      },

      onInit: ({ paneID, doc, body }) => {
        Zotero.debug("Section initialized");
      },
      onDestroy: ({ paneID, doc, body }) => {
        // Release resource
        Zotero.debug("Section destroyed");
      },

      // ZLL FIX 1: Visibility/Enabling controller callback matching Z9 schema
      onItemChange: ({ item, setEnabled }) => {
        // Only wake this pane if the selected active item is a valid Zotero Annotation
        setEnabled(item && item.isAnnotation());
      },

      // ZLL FIX 2: Correct destructuring matching Z9 API signatures
      onRender: ({ doc, body, item }) => {
        if (!item || !item.isAnnotation()) return;

        // Reset your structural layout container cleanly
        body.innerHTML = "";

        // Intercept web component element layout tree to cleanly draw your pane label title
        try {
          const sectionElement = body.closest("collapsible-section");
          if (sectionElement) {
            const titleBox = sectionElement.querySelector(".title-box");
            if (titleBox) {
              titleBox.textContent = "ZLL Classification";
            }
          }
        } catch (err) {
          Zotero.debug("[ZLL] Section element wrapper query note: " + err);
        }

        // Map colors from your global schemas
        const colorName = item.annotationColor || "yellow";
        const schema =
          ZLLAnnotationSchema[colorName] || ZLLAnnotationSchema.yellow;

        const container = doc.createElement("div");
        container.style.padding = "4px 8px 8px 8px";
        container.style.fontSize = "12px";

        // Row 1: Logic Type Display Card
        const logicRow = doc.createElement("div");
        logicRow.style.fontWeight = "bold";
        logicRow.style.marginBottom = "4px";
        logicRow.textContent = `${schema.emoji} Type: ${schema.logic}`;
        container.appendChild(logicRow);

        // Row 2: Academic Core Descriptive Function
        const functionRow = doc.createElement("div");
        functionRow.style.color = "var(--theme-text-secondary, #666)";
        functionRow.style.marginBottom = "6px";
        functionRow.textContent = schema.functionText;
        functionRow.setAttribute(
          "title",
          `Framework context for ${schema.logic}`,
        );
        container.appendChild(functionRow);

        // Row 3: Target Obsidian Vault Path Mapping Properties
        const mappingRow = doc.createElement("div");
        mappingRow.style.background =
          "var(--theme-background-secondary, #f5f5f5)";
        mappingRow.style.padding = "4px 6px";
        mappingRow.style.borderRadius = "3px";
        mappingRow.style.fontFamily = "monospace";
        mappingRow.textContent = `Obsidian: [[${schema.obsidian}]]`;
        container.appendChild(mappingRow);

        body.appendChild(container);
      },

      onAsyncRender: async ({ body }) => {
        // Put time-consuming rendering here
        await new Promise((resolve) => setTimeout(resolve, 1000));
        body
          .querySelector(".my-plugin-section")
          ?.style.setProperty("color", "red");
      },
      onToggle: ({
        paneID,
        doc,
        body,
        item,
        tabType,
        editable,
        setEnabled,
      }) => {
        // Handle section toggle
        Zotero.debug("Section toggled");
      },
      sectionButtons: [
        // Section button will appear in the header
      ],
    });

    // Event proxy framework execution initialization for mouseover bindings
    this._setupHoverTooltips();
  }

  _setupHoverTooltips() {
    const listenerId = Zotero.Reader.registerEventListener(
      "readerLoad",
      (event) => {
        const reader = event.reader;
        const readerDoc = reader.window.document;

        readerDoc.addEventListener(
          "mouseover",
          (e) => {
            const annotationEl = e.target.closest(".annotation");
            if (!annotationEl) return;

            const annotationId =
              annotationEl.getAttribute("data-annotation-id");
            if (!annotationId) return;

            const item = Zotero.Items.getByLibraryAndKey(
              reader.libraryID,
              annotationId,
            );
            if (item && item.isAnnotation()) {
              const color = item.annotationColor || "yellow";
              const schema = ZLLAnnotationSchema[color];

              if (schema && !annotationEl.hasAttribute("title")) {
                annotationEl.setAttribute(
                  "title",
                  `[${schema.logic}] — ${schema.functionText}\nMapping: ${schema.obsidian}`,
                );
              }
            }
          },
          true,
        );
      },
    );

    this._readerListenerIds.push(listenerId);
  }

  unregister() {
    Zotero.ItemPaneManager.unregisterSection(this.sectionId);

    for (let id of this._readerListenerIds) {
      try {
        Zotero.Reader.unregisterEventListener(id);
      } catch (e) {
        Zotero.debug("[ZLL] Error purging reader listener frames: " + e);
      }
    }
    this._readerListenerIds = [];
  }
}

globalThis.ZLLAnnotationManager = ZLLAnnotationManager;
