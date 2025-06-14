import copy from "copy-to-clipboard";
import Preview from "./components/Preview";
import GradientsPanel from "./components/GradientsPanel";
import CodePanel from "./components/CodePanel";
import About from "./components/About";
import WarningsPanel from "./components/WarningsPanel";
import {
  Framework,
  HTMLPreview,
  LinearGradientConversion,
  PluginSettings,
  SolidColorConversion,
  Warning,
} from "types";
import {
  preferenceOptions,
  selectPreferenceOptions,
} from "./codegenPreferenceOptions";
import Loading from "./components/Loading";
import { useState } from "react";
import { InfoIcon } from "lucide-react";
import React from "react";

type PluginUIProps = {
  code: string;
  htmlPreview: HTMLPreview;
  warnings: Warning[];
  selectedFramework: Framework;
  setSelectedFramework: (framework: Framework) => void;
  settings: PluginSettings | null;
  onPreferenceChanged: (
    key: keyof PluginSettings,
    value: boolean | string | number,
  ) => void;
  gradients: LinearGradientConversion[];
  isLoading: boolean;
  installationId: string | null;
};

const frameworks: Framework[] = ["Tailwind"];

type FrameworkTabsProps = {
  frameworks: Framework[];
  selectedFramework: Framework;
  setSelectedFramework: (framework: Framework) => void;
  showAbout: boolean;
  setShowAbout: (show: boolean) => void;
};

const FrameworkTabs = ({
  frameworks,
  selectedFramework,
  setSelectedFramework,
  showAbout,
  setShowAbout,
}: FrameworkTabsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-1 grow">
      <button
        key="tab Tailwind"
        className={`w-full text-sm rounded-md transition-colors font-medium ${
          !showAbout
            ? "bg-primary text-primary-foreground shadow-xs"
            : "bg-muted hover:bg-primary/90 hover:text-primary-foreground"
        }`}
        onClick={() => {
          setSelectedFramework("Tailwind" as Framework);
          setShowAbout(false);
        }}
      >
        HTML
      </button>
    </div>
  );
};

export const PluginUI = (props: PluginUIProps) => {
  const [showAbout, setShowAbout] = useState(false);

  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [previewViewMode, setPreviewViewMode] = useState<
    "desktop" | "mobile" | "precision"
  >("precision");
  const [previewBgColor, setPreviewBgColor] = useState<"white" | "black">(
    "white",
  );

  if (props.isLoading) return <Loading />;

  const isEmpty = props.code === "";
  const warnings = props.warnings ?? [];

  return (
    <div className="flex flex-col h-full dark:text-white">
      <div className="p-2 dark:bg-card">
        <div className="flex gap-1 bg-muted dark:bg-card rounded-lg p-1">
          <FrameworkTabs
            frameworks={frameworks}
            selectedFramework={props.selectedFramework}
            setSelectedFramework={props.setSelectedFramework}
            showAbout={showAbout}
            setShowAbout={setShowAbout}
          />
          <button
            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
              showAbout
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted hover:bg-primary/90 hover:text-primary-foreground"
            }`}
            onClick={() => setShowAbout(!showAbout)}
            aria-label="About"
          >
            <InfoIcon size={16} />
          </button>
        </div>
      </div>
      <div
        style={{
          height: 1,
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.12)",
        }}
      ></div>
      <div className="flex flex-col h-full overflow-y-auto">
        {showAbout ? (
          <About
            useOldPluginVersion={props.settings?.useOldPluginVersion2025}
            onPreferenceChanged={props.onPreferenceChanged}
            installationId={props.installationId}
          />
        ) : (
          <div className="flex flex-col items-center px-4 py-2 gap-2 dark:bg-transparent">
            {isEmpty === false && props.htmlPreview && (
              <Preview
                htmlPreview={props.htmlPreview}
                expanded={previewExpanded}
                setExpanded={setPreviewExpanded}
                viewMode={previewViewMode}
                setViewMode={setPreviewViewMode}
                bgColor={previewBgColor}
                setBgColor={setPreviewBgColor}
              />
            )}

            {warnings.length > 0 && <WarningsPanel warnings={warnings} />}

            <CodePanel
              code={props.code}
              selectedFramework={props.selectedFramework}
              preferenceOptions={preferenceOptions}
              selectPreferenceOptions={selectPreferenceOptions}
              settings={props.settings}
              onPreferenceChanged={props.onPreferenceChanged}
            />

            {props.gradients.length > 0 && (
              <GradientsPanel
                gradients={props.gradients}
                onColorClick={(value) => {
                  copy(value);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
