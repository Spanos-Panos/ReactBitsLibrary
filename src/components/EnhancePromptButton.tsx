import React, { useState } from "react";
import "./EnhancePromptButton.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectedComponent {
  name: string;
  category: string;
  usageMarkdown: string;
}

interface EnhancePromptButtonProps {
  rawPrompt: string;
  selectedComponents: SelectedComponent[];
  onSuccess?: (result: { enhancedPrompt: object; savedPaths: { original: string; enhanced: string } }) => void;
  onError?: (error: Error) => void;
}

type Status = "idle" | "loading" | "success" | "error";

// ─── Component ────────────────────────────────────────────────────────────────

export const EnhancePromptButton: React.FC<EnhancePromptButtonProps> = ({
  rawPrompt,
  selectedComponents,
  onSuccess,
  onError,
}) => {
  const [status, setStatus] = useState<Status>("idle");
  const [savedPath, setSavedPath] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const canEnhance =
    rawPrompt.trim().length > 0 && selectedComponents.length > 0;

  const handleEnhance = async () => {
    if (!canEnhance || status === "loading") return;

    setStatus("loading");
    setErrorMessage("");
    setSavedPath("");

    try {
      const result = await (window as any).reactBitsApi.enhancePrompt({ 
        rawPrompt, 
        selectedComponents 
      });

      if (result.success) {
        setSavedPath(result.savedPaths.enhanced);
        setStatus("success");
        onSuccess?.(result);
      } else {
        throw new Error(result.error || "Failed to enhance prompt");
      }

      // Reset after 4 seconds
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      setErrorMessage(error.message);
      setStatus("error");
      onError?.(error);

      setTimeout(() => setStatus("idle"), 15000);
    }
  };

  return (
    <div className="enhance-prompt-wrapper">
      <button
        className={`enhance-prompt-btn enhance-prompt-btn--${status}`}
        onClick={handleEnhance}
        disabled={!canEnhance || status === "loading"}
        title={
          !rawPrompt.trim()
            ? "Write a prompt first"
            : selectedComponents.length === 0
            ? "Select at least one component"
            : "Enhance your prompt with AI (Gemini ✨)"
        }
      >
        {status === "loading" && (
          <>
            <span className="enhance-prompt-btn__spinner" />
            Enhancing…
          </>
        )}
        {status === "success" && (
          <>
            <span className="enhance-prompt-btn__icon">✓</span>
            Enhanced!
          </>
        )}
        {status === "error" && (
          <>
            <span className="enhance-prompt-btn__icon">✕</span>
            Failed — retry?
          </>
        )}
        {status === "idle" && (
          <>
            <span className="enhance-prompt-btn__icon">✦</span>
            Enhance with AI
          </>
        )}
      </button>

      {status === "success" && savedPath && (
        <p className="enhance-prompt-saved-path" title={savedPath}>
          Saved → <span>{savedPath}</span>
        </p>
      )}

      {status === "error" && errorMessage && (
        <p className="enhance-prompt-error">{errorMessage}</p>
      )}
    </div>
  );
};
