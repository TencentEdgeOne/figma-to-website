"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Check, AlertCircle, X, Info, Copy, Link, ExternalLink } from "lucide-react";
import { cn } from "../lib/utils";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-md shadow-lg text-white ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
      style={{ zIndex: 9999 }}
    >
      {type === "success" ? (
        <Check className="h-5 w-5" />
      ) : (
        <AlertCircle className="h-5 w-5" />
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

interface SuccessModalProps {
  url: string;
  onClose: () => void;
}

const SuccessModal = ({ url, onClose }: SuccessModalProps) => {
  const [copied, setCopied] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    if (urlInputRef.current) {
      urlInputRef.current.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVisit = () => {
    window.open(url, '_blank');
  };

  // Handle clicks outside the modal to close it
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[1000]">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
      >
        <div className="mb-4 flex items-center">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
            <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Published Successfully!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your website has been successfully published</p>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="site-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Website URL
          </label>
          <div className="flex">
            <div className="relative flex-grow">
              <input
                ref={urlInputRef}
                type="text"
                id="site-url"
                value={url}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleCopy}
              className={`px-3 py-2 ${copied ? 'bg-green-600' : 'bg-indigo-600'} text-white rounded-r-md hover:${copied ? 'bg-green-700' : 'bg-indigo-700'} focus:outline-none transition-colors`}
            >
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleVisit}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit Website
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface PublishButtonProps {
  value: string;
  className?: string;
  showLabel?: boolean;
  successDuration?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function PublishButton({
  value,
  className,
  showLabel = true,
  successDuration = 2000,
  onMouseEnter,
  onMouseLeave,
}: PublishButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (isPublished && !successUrl) {
      const timer = setTimeout(() => {
        setIsPublished(false);
      }, successDuration);

      return () => clearTimeout(timer);
    }
  }, [isPublished, successDuration, successUrl]);

  useEffect(() => {
    let interval: number;
    
    if (cooldownActive && cooldownSeconds > 0) {
      interval = setInterval(() => {
        setCooldownSeconds(prev => {
          if (prev <= 1) {
            setCooldownActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldownActive, cooldownSeconds]);

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      setError(null);
      setSuccessUrl(null);
      
      // Use the plugin's messaging mechanism to send publish request to the main thread
      const publishViaMainThread = () => {
        return new Promise<{ success: boolean; message: string; url?: string }>((resolve, reject) => {
          // Set up a listener to receive responses from the main thread
          const messageHandler = (event: MessageEvent) => {
            const pluginMessage = event.data.pluginMessage;
            if (pluginMessage && pluginMessage.type === "publishResult") {
              // Clean up listener
              window.removeEventListener("message", messageHandler);
              
              if (pluginMessage.success) {
                resolve({ 
                  success: true, 
                  message: pluginMessage.message || "Code published successfully!",
                  url: pluginMessage.url
                });
              } else {
                reject(new Error(pluginMessage.message || "Publish failed"));
              }
            }
          };
          
          // Add message listener
          window.addEventListener("message", messageHandler);
          
          // Send code to main thread
          parent.postMessage(
            { 
              pluginMessage: { 
                type: "publishCode", 
                code: value 
              } 
            }, 
            "*"
          );
          
          // Timeout after 30 seconds
          setTimeout(() => {
            window.removeEventListener("message", messageHandler);
            reject(new Error("Publish request timed out, please try again"));
          }, 30000);
        });
      };
      
      try {
        const result = await publishViaMainThread();
        setIsPublished(true);
        
        // Start cooldown timer after successful publish
        setCooldownActive(true);
        setCooldownSeconds(30);
        
        if (result.url) {
          setSuccessUrl(result.url);
        } else {
          setToast({ 
            message: result.message || "Code published successfully!", 
            type: "success" 
          });
        }
      } catch (error) {
        throw error;
      }
    } catch (error) {
      console.error("Failed to publish: ", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      setToast({ message: `Publish failed: ${errorMessage}`, type: "error" });
    } finally {
      setIsPublishing(false);
    }
  };

  const closeSuccessModal = () => {
    setSuccessUrl(null);
    setIsPublished(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={handlePublish}
          onMouseEnter={() => {
            setShowTooltip(true);
            onMouseEnter && onMouseEnter();
          }}
          onMouseLeave={() => {
            setShowTooltip(false);
            onMouseLeave && onMouseLeave();
          }}
          disabled={isPublishing || cooldownActive}
          className={cn(
            `inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300`,
            isPublished
              ? "bg-green-600 text-white hover:bg-green-700"
              : error
              ? "bg-red-600 text-white hover:bg-red-700"
              : cooldownActive
              ? "bg-gray-500 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:text-white",
            className,
            `relative`,
            (isPublishing || cooldownActive) ? "opacity-80 cursor-not-allowed" : "opacity-100"
          )}
          aria-label={
            cooldownActive 
              ? `Wait ${cooldownSeconds}s` 
              : isPublished 
              ? "Published!" 
              : error 
              ? "Error" 
              : "Publish"
          }
        >
          <div className="relative h-4 w-4 mr-1.5">
            {/* Display upload icon in unpublished state */}
            <span
              className={`absolute inset-0 transition-all duration-200 ${
                isPublished || error || isPublishing || cooldownActive
                  ? "opacity-0 scale-75 rotate-[-10deg]"
                  : "opacity-100 scale-100 rotate-0"
              }`}
            >
              <Upload className="h-4 w-4 text-white" />
            </span>
            
            {/* Display check icon in success state */}
            <span
              className={`absolute inset-0 transition-all duration-200 ${
                (isPublished && !error && !cooldownActive)
                  ? "opacity-100 scale-100 rotate-0"
                  : "opacity-0 scale-75 rotate-[10deg]"
              }`}
            >
              <Check className="h-4 w-4 text-white" />
            </span>
            
            {/* Display error icon in error state */}
            <span
              className={`absolute inset-0 transition-all duration-200 ${
                (error && !isPublishing && !cooldownActive)
                  ? "opacity-100 scale-100 rotate-0"
                  : "opacity-0 scale-75 rotate-[10deg]"
              }`}
            >
              <X className="h-4 w-4 text-white" />
            </span>
            
            {/* Display cooldown icon */}
            {cooldownActive && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M12 6v6l4 2"
                  />
                </svg>
              </span>
            )}
          </div>

          {showLabel && (
            <span className="font-medium">
              {isPublishing
                ? "Publishing..."
                : cooldownActive
                ? `Wait ${cooldownSeconds}s`
                : isPublished
                ? "Published"
                : error
                ? "Failed"
                : "Publish"}
            </span>
          )}

          {isPublished && !error && !cooldownActive && (
            <span
              className="absolute inset-0 rounded-md animate-pulse bg-green-500/20"
              aria-hidden="true"
            />
          )}
        </button>
        
        {showTooltip && (
          <div 
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 z-[100] px-4 py-2 bg-gray-900 text-white text-sm rounded-md shadow-lg w-56 mb-2"
            style={{ borderWidth: '1px', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-indigo-400" />
              <span className="leading-snug">
                {cooldownActive 
                  ? `Please wait ${cooldownSeconds} seconds before publishing again` 
                  : "Publish code to a remote server to make it accessible via the web"}
              </span>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-gray-900 border-r border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}></div>
          </div>
        )}
      </div>
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {successUrl && <SuccessModal url={successUrl} onClose={closeSuccessModal} />}
    </>
  );
} 