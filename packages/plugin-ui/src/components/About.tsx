import { useState } from "react";
import {
  ArrowRightIcon,
  Code,
  Github,
  Lock,
  Copy,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Zap,
} from "lucide-react";
import { PluginSettings } from "types";

type AboutProps = {
  useOldPluginVersion?: boolean;
  onPreferenceChanged: (
    key: keyof PluginSettings,
    value: boolean | string | number,
  ) => void;
  installationId?: string | null;
};

const About = ({
  useOldPluginVersion = false,
  onPreferenceChanged,
  installationId,
}: AboutProps) => {
  const [copied, setCopied] = useState(false);

  const copySelectionJson = async () => {
    try {
      // Send message to the plugin to get selection JSON
      parent.postMessage(
        { pluginMessage: { type: "get-selection-json" } },
        "*",
      );

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy selection JSON:", error);
    }
  };

  const togglePluginVersion = () => {
    onPreferenceChanged("useOldPluginVersion2025", !useOldPluginVersion);
  };

  return (
    <div className="flex flex-col p-5 gap-6 text-sm max-w-2xl mx-auto">
      {/* Header Section with Logo and Title */}
      <div className="flex flex-col items-center text-center mb-2">
        <h2 className="text-2xl font-bold mb-1">Figma to Website</h2>
      </div>

      {/* Features Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-2xs border border-neutral-200 dark:border-neutral-700 hover:border-green-300 dark:hover:border-green-700 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
            <Zap size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold text-base">Features</h3>
        </div>
        <ul className="text-neutral-600 dark:text-neutral-300 space-y-2 leading-relaxed">
          <li className="flex items-start gap-2">
            <div className="mt-1.5">
              <ArrowRightIcon size={12} />
            </div>
            <span>Convert Figma designs to HTML code</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="mt-1.5">
              <ArrowRightIcon size={12} />
            </div>
            <span>One-click publishing to web</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="mt-1.5">
              <ArrowRightIcon size={12} />
            </div>
            <span>
              Open source code available on{" "}
              <a
                href="https://github.com/TencentEdgeOne/figma-to-website"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 dark:text-green-400 hover:underline"
              >
                GitHub
              </a>
            </span>
          </li>
        </ul>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original Project Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-2xs border border-neutral-200 dark:border-neutral-700 hover:border-green-300 dark:hover:border-green-700 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <Github
                size={20}
                className="text-purple-600 dark:text-purple-400"
              />
            </div>
            <h3 className="font-semibold text-base">Original Project</h3>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">
            This plugin is based on the open-source Figma to Code project by
            Bernardo Ferrari.
          </p>
          <a
            href="https://github.com/bernaferrari/figmatocode"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-md text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <span>View Original GitHub Project</span>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 text-center text-neutral-500 dark:text-neutral-400 text-xs">
        <p>
          Powered by{" "}
          <a
            href="https://edgeone.ai/products/pages"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 dark:text-green-400 hover:underline"
          >
            EdgeOne Pages
          </a>
        </p>
        <p>
          Based on Figma to Code by{" "}
          <a
            href="https://github.com/bernaferrari/figmatocode"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 dark:text-green-400 hover:underline"
          >
            Bernardo Ferrari
          </a>
        </p>
        {installationId && (
          <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-2">
            Installation ID:{" "}
            <span className="font-mono text-neutral-600 dark:text-neutral-300">
              {installationId}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default About;
