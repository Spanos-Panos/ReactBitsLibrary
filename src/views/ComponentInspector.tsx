import { useState, useEffect } from "react";
import type { ReactBitsItem, ParsedInstallData } from "../types/index";

type Mode    = 'eye' | 'code';
type SubMode = 'install' | 'usage' | 'code';

interface Props {
  selected:           ReactBitsItem | null;
  componentFiles:     { name: string; content: string }[];
  parsedInstallData:  ParsedInstallData;
  rawInstallMarkdown: string;
  onGenerate:         () => void;
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const BookIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const FileCodeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function ComponentInspector({
  selected,
  componentFiles,
  parsedInstallData,
  rawInstallMarkdown,
  onGenerate,
}: Props) {
  const [mode,       setMode]       = useState<Mode>('eye');
  const [subMode,    setSubMode]    = useState<SubMode>('code');
  const [activeFile, setActiveFile] = useState(0);
  const [isCopied,   setIsCopied]   = useState(false);
  const [subVisible, setSubVisible] = useState(false);

  // reset when selection changes
  useEffect(() => {
    setMode('eye');
    setSubMode('code');
    setActiveFile(0);
    setSubVisible(false);
  }, [selected?.id]);

  // animate sub-bar in after a tick so CSS transition fires
  useEffect(() => {
    if (mode === 'code') {
      const t = setTimeout(() => setSubVisible(true), 16);
      return () => clearTimeout(t);
    } else {
      setSubVisible(false);
    }
  }, [mode]);

  const handleCopy = () => {
    let text = '';
    if (subMode === 'install') text = rawInstallMarkdown || parsedInstallData.cli['npm'] || '';
    else if (subMode === 'usage') text = selected?.usageMarkdown || '';
    else text = componentFiles[activeFile]?.content || '';
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getContent = () => {
    if (subMode === 'install') return rawInstallMarkdown || `# Install\n\nnpx react-bits add ${selected?.id}`;
    if (subMode === 'usage')   return selected?.usageMarkdown || 'No usage docs found.';
    return componentFiles[activeFile]?.content || 'No source code loaded.';
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!selected) {
    return (
      <div className="ci-root ci-root--empty">
        <img src="/ReactIcon.svg" alt="BitForge" className="ci-empty-logo" />
        <span className="ci-empty-label">BitForge</span>
        <span className="ci-empty-hint">Select a component to inspect</span>
      </div>
    );
  }

  // ── Active state ────────────────────────────────────────────────────────────
  return (
    <div className="ci-root">

      {/* Preview zone */}
      <div className="ci-preview-zone">
        {mode === 'eye' ? (
          <span className="ci-preview-hint">Preview coming soon</span>
        ) : null}
      </div>

      {/* Mode bar — slim horizontal strip with icons roughly in center */}
      <div className="ci-mode-bar">
        <span className="ci-comp-name">{selected.name}</span>
        <span className="ci-comp-category">// {selected.category}</span>
        <div className="ci-mode-icons">
          <button
            className={`ci-mode-btn${mode === 'eye'  ? ' ci-mode-btn--active' : ''}`}
            onClick={() => setMode('eye')}
            title="Preview"
          >
            <EyeIcon />
          </button>
          <button
            className={`ci-mode-btn${mode === 'code' ? ' ci-mode-btn--active' : ''}`}
            onClick={() => setMode('code')}
            title="Code"
          >
            <CodeIcon />
          </button>
        </div>
      </div>

      {/* Sub-buttons — fade in when code mode */}
      <div className={`ci-sub-bar${subVisible ? ' ci-sub-bar--visible' : ''}`}>
        <button
          className={`ci-sub-btn${subMode === 'install' ? ' ci-sub-btn--active' : ''}`}
          onClick={() => setSubMode('install')}
          title="Install"
        >
          <DownloadIcon />
          <span>Install</span>
        </button>
        <button
          className={`ci-sub-btn${subMode === 'usage' ? ' ci-sub-btn--active' : ''}`}
          onClick={() => setSubMode('usage')}
          title="Usage"
        >
          <BookIcon />
          <span>Usage</span>
        </button>
        <button
          className={`ci-sub-btn${subMode === 'code' ? ' ci-sub-btn--active' : ''}`}
          onClick={() => setSubMode('code')}
          title="Code"
        >
          <FileCodeIcon />
          <span>Code</span>
        </button>

        {/* File tabs — only in code sub-mode with multiple files */}
        {subMode === 'code' && componentFiles.length > 1 && (
          <div className="ci-file-tabs">
            {componentFiles.map((f, i) => (
              <button
                key={i}
                className={`ci-file-tab${activeFile === i ? ' ci-file-tab--active' : ''}`}
                onClick={() => setActiveFile(i)}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        {/* Copy button — pinned to right */}
        <button
          className={`ci-copy-btn${isCopied ? ' ci-copy-btn--done' : ''}`}
          onClick={handleCopy}
          title="Copy"
        >
          <CopyIcon />
          <span>{isCopied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Content area */}
      <div className="ci-content">
        {mode === 'eye' ? (
          <div className="ci-eye-content">
            <button className="ci-generate-btn" onClick={onGenerate}>
              Generate demo with {selected.name}
            </button>
          </div>
        ) : (
          <pre className="ci-code">{getContent()}</pre>
        )}
      </div>

    </div>
  );
}
