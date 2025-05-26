import { tailwindCodeGenTextStyles } from "./../../../packages/backend/src/tailwind/tailwindMain";
import { run, tailwindMain, htmlMain, postSettingsChanged } from "backend";
import { nodesToJSON } from "backend/src/altNodes/jsonNodeConversion";
import { retrieveGenericSolidUIColors } from "backend/src/common/retrieveUI/retrieveColors";
import { htmlCodeGenTextStyles } from "backend/src/html/htmlMain";
import { PluginSettings, SettingWillChangeMessage } from "types";

// Generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get or generate installation ID
let installationId: string;

const getInstallationId = async (): Promise<string> => {
  if (installationId) {
    return installationId;
  }
  
  // Try to get existing installation ID from storage
  const storedId = await figma.clientStorage.getAsync("installationId");
  if (storedId) {
    installationId = storedId;
    return installationId;
  }
  
  // Generate new installation ID
  installationId = generateUUID();
  await figma.clientStorage.setAsync("installationId", installationId);
  return installationId;
};

let userPluginSettings: PluginSettings;

export const defaultPluginSettings: PluginSettings = {
  framework: "HTML" as const,
  showLayerNames: false,
  useOldPluginVersion2025: false,
  responsiveRoot: false,
  roundTailwindValues: true,
  roundTailwindColors: true,
  useColorVariables: true,
  customTailwindPrefix: "",
  embedImages: false,
  embedVectors: true,
  htmlGenerationMode: "html",
  tailwindGenerationMode: "html",
  baseFontSize: 16,
  useTailwind4: true,
};

// A helper type guard to ensure the key belongs to the PluginSettings type
function isKeyOfPluginSettings(key: string): key is keyof PluginSettings {
  return key in defaultPluginSettings;
}

const getUserSettings = async () => {
  console.log("[DEBUG] getUserSettings - Starting to fetch user settings");
  const possiblePluginSrcSettings =
    (await figma.clientStorage.getAsync("userPluginSettings")) ?? {};
  console.log(
    "[DEBUG] getUserSettings - Raw settings from storage:",
    possiblePluginSrcSettings,
  );

  const updatedPluginSrcSettings = {
    ...defaultPluginSettings,
    ...Object.keys(defaultPluginSettings).reduce((validSettings, key) => {
      if (
        isKeyOfPluginSettings(key) &&
        key in possiblePluginSrcSettings &&
        typeof possiblePluginSrcSettings[key] ===
          typeof defaultPluginSettings[key]
      ) {
        validSettings[key] = possiblePluginSrcSettings[key] as any;
      }
      return validSettings;
    }, {} as Partial<PluginSettings>),
  };

  userPluginSettings = updatedPluginSrcSettings as PluginSettings;
  console.log("[DEBUG] getUserSettings - Final settings:", userPluginSettings);
  return userPluginSettings;
};

const initSettings = async () => {
  console.log("[DEBUG] initSettings - Initializing plugin settings");
  await getUserSettings();
  postSettingsChanged(userPluginSettings);
  console.log("[DEBUG] initSettings - Calling safeRun with settings");
  safeRun(userPluginSettings);
};

// Used to prevent running from happening again.
let isLoading = false;
const safeRun = async (settings: PluginSettings) => {
  console.log(
    "[DEBUG] safeRun - Called with isLoading =",
    isLoading,
    "selection =",
    figma.currentPage.selection,
  );
  if (isLoading === false) {
    try {
      isLoading = true;
      console.log("[DEBUG] safeRun - Starting run execution");
      await run(settings);
      console.log("[DEBUG] safeRun - Run execution completed");
      // hack to make it not immediately set to false when complete. (executes on next frame)
      setTimeout(() => {
        console.log("[DEBUG] safeRun - Resetting isLoading to false");
        isLoading = false;
      }, 1);
    } catch (e) {
      console.log("[DEBUG] safeRun - Error caught in execution");
      isLoading = false; // Make sure to reset the flag on error
      if (e && typeof e === "object" && "message" in e) {
        const error = e as Error;
        console.log("error: ", error.stack);
        figma.ui.postMessage({ type: "error", error: error.message });
      } else {
        // Handle non-standard errors or unknown error types
        const errorMessage = String(e);
        console.log("Unknown error: ", errorMessage);
        figma.ui.postMessage({
          type: "error",
          error: errorMessage || "Unknown error occurred",
        });
      }

      // Send a message to reset the UI state
      figma.ui.postMessage({ type: "conversion-complete", success: false });
    }
  } else {
    console.log(
      "[DEBUG] safeRun - Skipping execution because isLoading =",
      isLoading,
    );
  }
};

const standardMode = async () => {
  console.log("[DEBUG] standardMode - Starting standard mode initialization");
  figma.showUI(__html__, { width: 450, height: 700, themeColors: true });
  await initSettings();
  
  // Send installation ID to UI
  const currentInstallationId = await getInstallationId();
  figma.ui.postMessage({
    type: "installationId",
    installationId: currentInstallationId,
  });

  // Listen for selection changes
  figma.on("selectionchange", () => {
    console.log(
      "[DEBUG] selectionchange event - New selection:",
      figma.currentPage.selection,
    );
    safeRun(userPluginSettings);
  });

  // Listen for page changes
  figma.loadAllPagesAsync();
  figma.on("documentchange", () => {
    console.log("[DEBUG] documentchange event triggered");
    // Node: This was causing an infinite load when you try to export a background image from a group that contains children.
    // The reason for this is that the code will temporarily hide the children of the group in order to export a clean image
    // then restores the visibility of the children. This constitutes a document change so it's restarting the whole conversion.
    // In order to stop this, we disable safeRun() when doing conversions (while isLoading === true).
    safeRun(userPluginSettings);
  });

  figma.ui.onmessage = async (msg) => {
    console.log("[DEBUG] figma.ui.onmessage", msg);

    if (msg.type === "pluginSettingWillChange") {
      const { key, value } = msg as SettingWillChangeMessage<unknown>;
      console.log(`[DEBUG] Setting changed: ${key} = ${value}`);
      (userPluginSettings as any)[key] = value;
      figma.clientStorage.setAsync("userPluginSettings", userPluginSettings);
      safeRun(userPluginSettings);
    } else if (msg.type === "get-selection-json") {
      console.log("[DEBUG] get-selection-json message received");

      const nodes = figma.currentPage.selection;
      if (nodes.length === 0) {
        figma.ui.postMessage({
          type: "selection-json",
          data: { message: "No nodes selected" },
        });
        return;
      }
      const result: {
        json?: SceneNode[];
        oldConversion?: any;
        newConversion?: any;
      } = {};

      try {
        result.json = (await Promise.all(
          nodes.map(
            async (node) =>
              (
                (await node.exportAsync({
                  format: "JSON_REST_V1",
                })) as any
              ).document,
          ),
        )) as SceneNode[];
      } catch (error) {
        console.error("Error exporting JSON:", error);
      }

      try {
        const newNodes = await nodesToJSON(
          nodes as ReadonlyArray<SceneNode>,
          userPluginSettings,
        );
        const removeParent = (node: any) => {
          if (node.parent) {
            delete node.parent;
          }
          if (node.children) {
            node.children.forEach(removeParent);
          }
        };
        newNodes.forEach(removeParent);
        result.newConversion = newNodes;
      } catch (error) {
        console.error("Error in new conversion:", error);
      }

      const nodeJson = result;

      console.log("[DEBUG] Exported node JSON:", nodeJson);

      // Send the JSON data back to the UI
      figma.ui.postMessage({
        type: "selection-json",
        data: nodeJson,
      });
    } else if (msg.type === "publishCode") {
      // Handle publish request from UI
      console.log("[DEBUG] Received publish code request", msg.code);

      try {
        // Try to publish directly to the original address
        const currentInstallationId = await getInstallationId();
        const response = await fetch("https://mcp.edgeone.site/kv/set", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'X-Installation-ID': currentInstallationId,
          },
          body: JSON.stringify({ value: msg.code }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        if (!data.url) {
          throw new Error(data.error || "No URL returned from server");
        }

        // Send publish result back to UI
        figma.ui.postMessage({
          type: "publishResult",
          success: true,
          message: "Code published successfully!",
          url: data.url,
          key: data.key,
        });
      } catch (error) {
        console.error("Error publishing code:", error);

        // Return error message to UI and provide method to get code
        figma.ui.postMessage({
          type: "publishResult",
          success: false,
          message: (error as Error).message,
        });
      }
    }
  };
};

const codegenMode = async () => {
  console.log("[DEBUG] codegenMode - Starting codegen mode initialization");
  // figma.showUI(__html__, { visible: false });
  await getUserSettings();

  figma.codegen.on(
    "generate",
    async ({ language, node }: CodegenEvent): Promise<CodegenResult[]> => {
      console.log(
        `[DEBUG] codegen.generate - Language: ${language}, Node:`,
        node,
      );

      const convertedSelection = await nodesToJSON(
        [node] as ReadonlyArray<SceneNode>,
        userPluginSettings,
      );
      console.log(
        "[DEBUG] codegen.generate - Converted selection:",
        convertedSelection,
      );

      switch (language) {
        case "html":
          return [
            {
              title: "Code",
              code: (
                await htmlMain(
                  convertedSelection as any,
                  { ...userPluginSettings, htmlGenerationMode: "html" },
                  true,
                )
              ).html,
              language: "HTML",
            },
            {
              title: "Text Styles",
              code: htmlCodeGenTextStyles(userPluginSettings),
              language: "HTML",
            },
          ];
        case "html_jsx":
          return [
            {
              title: "Code",
              code: (
                await htmlMain(
                  convertedSelection as any,
                  { ...userPluginSettings, htmlGenerationMode: "jsx" },
                  true,
                )
              ).html,
              language: "HTML",
            },
            {
              title: "Text Styles",
              code: htmlCodeGenTextStyles(userPluginSettings),
              language: "HTML",
            },
          ];

        case "html_svelte":
          return [
            {
              title: "Code",
              code: (
                await htmlMain(
                  convertedSelection as any,
                  { ...userPluginSettings, htmlGenerationMode: "svelte" },
                  true,
                )
              ).html,
              language: "HTML",
            },
            {
              title: "Text Styles",
              code: htmlCodeGenTextStyles(userPluginSettings),
              language: "HTML",
            },
          ];

        case "html_styled_components":
          return [
            {
              title: "Code",
              code: (
                await htmlMain(
                  convertedSelection as any,
                  {
                    ...userPluginSettings,
                    htmlGenerationMode: "styled-components",
                  },
                  true,
                )
              ).html,
              language: "HTML",
            },
            {
              title: "Text Styles",
              code: htmlCodeGenTextStyles(userPluginSettings),
              language: "HTML",
            },
          ];

        case "tailwind":
          return [
            {
              title: "Code",
              code: await tailwindMain(convertedSelection as any, {
                ...userPluginSettings,
                tailwindGenerationMode: "html",
              }),
              language: "HTML",
            },
            {
              title: "Tailwind Colors",
              code: (await retrieveGenericSolidUIColors("Tailwind"))
                .map((d) => {
                  let str = `${d.hex};`;
                  if (d.colorName !== d.hex) {
                    str += ` // ${d.colorName}`;
                  }
                  if (d.meta) {
                    str += ` (${d.meta})`;
                  }
                  return str;
                })
                .join("\n"),
              language: "JAVASCRIPT",
            },
            {
              title: "Text Styles",
              code: tailwindCodeGenTextStyles(),
              language: "HTML",
            },
          ];
        default:
          break;
      }

      const blocks: CodegenResult[] = [];
      return blocks;
    },
  );
};

switch (figma.mode) {
  case "default":
  case "inspect":
    console.log("[DEBUG] Starting plugin in", figma.mode, "mode");
    standardMode();
    break;
  case "codegen":
    console.log("[DEBUG] Starting plugin in codegen mode");
    codegenMode();
    break;
  default:
    console.log("[DEBUG] Unknown plugin mode:", figma.mode);
    break;
}
