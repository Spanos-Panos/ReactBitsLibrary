import { useState, useEffect, type ReactElement } from "react";
import type { ReactBitsItem, ParsedInstallData } from "../types/index";

type Mode = 'eye' | 'code';
type SubMode = 'install' | 'usage' | 'code';

interface Props {
  selected:           ReactBitsItem | null;
  componentFiles:     { name: string; content: string }[];
  parsedInstallData:  ParsedInstallData;
  rawInstallMarkdown: string;
  onGenerate:         () => void;
}

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const BracketsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const DocIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const FileCodeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <polyline points="10 13 8 15 10 17"/>
    <polyline points="14 13 16 15 14 17"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

function renderFilename(name: string) {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return <span className="ci-pane-filename">{name}</span>;
  return (
    <span className="ci-pane-filename">
      {name.slice(0, dot)}<span className="ci-pane-ext">{name.slice(dot)}</span>
    </span>
  );
}

const SUB_ICONS: Record<SubMode, ReactElement> = {
  install: <DownloadIcon />,
  usage:   <DocIcon />,
  code:    <FileCodeIcon />,
};

export default function ComponentInspector({
  selected,
  componentFiles,
  parsedInstallData,
  rawInstallMarkdown,
}: Props) {
  const [mode, setMode]           = useState<Mode>('eye');
  const [subMode, setSubMode]     = useState<SubMode>('install');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [displaySelected, setDisplaySelected] = useState<ReactBitsItem | null>(selected);
  const [fadeIn, setFadeIn]       = useState(true);
  const [contentVisible, setContentVisible] = useState(true);
  const [displayKey, setDisplayKey] = useState(`${mode}_${subMode}`);

  // Fade the whole active layer when the selected component changes
  useEffect(() => {
    if (selected?.id === displaySelected?.id) return;
    setFadeIn(false);
    const t = setTimeout(() => {
      setDisplaySelected(selected);
      setMode('eye');
      setSubMode('install');
      setDisplayKey('eye_install');
      setCopiedKey(null);
      requestAnimationFrame(() => requestAnimationFrame(() => setFadeIn(true)));
    }, 220);
    return () => clearTimeout(t);
  }, [selected?.id]);

  // Fade only the panel body when mode or subMode changes
  useEffect(() => {
    const next = `${mode}_${subMode}`;
    if (next === displayKey) return;
    setContentVisible(false);
    const t = setTimeout(() => {
      setDisplayKey(next);
      setCopiedKey(null);
      requestAnimationFrame(() => requestAnimationFrame(() => setContentVisible(true)));
    }, 140);
    return () => clearTimeout(t);
  }, [mode, subMode]);

  const [displayMode, displaySubMode] = displayKey.split('_') as [Mode, SubMode];

  const isActive       = !!displaySelected;
  const isAlwaysSplit  = componentFiles.length >= 2;
  const cliKeys        = Object.keys(parsedInstallData.cli);
  const manualKeys     = Object.keys(parsedInstallData.manual);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    });
  };

  return (
    <div className="ci-root">

      {/* ── Idle layer ── */}
      <div
        className="ci-layer ci-layer--idle"
        style={{ opacity: fadeIn && !isActive ? 1 : 0, pointerEvents: !isActive ? 'auto' : 'none' }}
      >
        <img src="/ReactIcon.svg" alt="BitForge" className="ci-empty-logo" />
        <span className="ci-empty-label">BitForge</span>
        <span className="ci-empty-hint">Select a component to inspect</span>
      </div>

      {/* ── Active layer ── */}
      <div
        className="ci-layer ci-layer--active"
        style={{ opacity: fadeIn && isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none' }}
      >
        {/* Main icon bar */}
        <div className="ci-icon-bar">
          <button
            className={`ci-icon-btn${mode === 'eye' ? ' ci-icon-btn--active' : ''}`}
            onClick={() => setMode('eye')}
            title="Preview"
          >
            <EyeIcon />
            {mode === 'eye' && <span className="ci-underline" />}
          </button>
          <button
            className={`ci-icon-btn${mode === 'code' ? ' ci-icon-btn--active' : ''}`}
            onClick={() => setMode('code')}
            title="Code"
          >
            <BracketsIcon />
            {mode === 'code' && <span className="ci-underline" />}
          </button>
        </div>

        {/* Sub-icon bar — icon only, centered, same height as icon bar */}
        <div className={`ci-sub-bar${mode === 'code' ? ' ci-sub-bar--visible' : ''}`}>
          {(Object.keys(SUB_ICONS) as SubMode[]).map(sm => (
            <button
              key={sm}
              className={`ci-sub-icon-btn${subMode === sm ? ' ci-sub-icon-btn--active' : ''}`}
              onClick={() => setSubMode(sm)}
              title={sm.charAt(0).toUpperCase() + sm.slice(1)}
            >
              {SUB_ICONS[sm]}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="ci-panel-body" style={{ opacity: contentVisible ? 1 : 0 }}>
          {displayMode === 'eye' ? (
            <div className="ci-blank-preview" />
          ) : (
            <>
              {/* ── Install: CLI left | Manual right ── */}
              {displaySubMode === 'install' && (
                <div className="ci-install-split">
                  <div className="ci-install-half">
                    <div className="ci-section-label">CLI</div>
                    <div className="ci-content ci-content--noscroll">
                      {cliKeys.length > 0
                        ? cliKeys.map(pm => (
                            <div
                              key={pm}
                              className={`ci-install-block${copiedKey === `cli_${pm}` ? ' ci-install-block--flash' : ''}`}
                              onClick={() => copy(parsedInstallData.cli[pm], `cli_${pm}`)}
                            >
                              <span className="ci-install-pm">{pm}</span>
                              <pre className="ci-code ci-code--block">{parsedInstallData.cli[pm]}</pre>
                            </div>
                          ))
                        : <pre className="ci-code">{rawInstallMarkdown || '—'}</pre>
                      }
                    </div>
                  </div>

                  <div className="ci-install-divider" />

                  <div className="ci-install-half">
                    <div className="ci-section-label">Manual</div>
                    <div className="ci-content ci-content--noscroll">
                      {manualKeys.length > 0
                        ? manualKeys.map(step => (
                            <div
                              key={step}
                              className={`ci-install-block ci-install-block--manual${copiedKey === `manual_${step}` ? ' ci-install-block--flash' : ''}`}
                              onClick={() => copy(parsedInstallData.manual[step], `manual_${step}`)}
                            >
                              <span className="ci-install-step">{step}</span>
                              <pre className="ci-code ci-code--block">{parsedInstallData.manual[step]}</pre>
                            </div>
                          ))
                        : <span className="ci-empty-section">—</span>
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* ── Usage: scrollable + FAB anchored to wrapper (not scroll container) ── */}
              {displaySubMode === 'usage' && (
                <div className="ci-usage-wrap">
                  <div className="ci-content ci-content--noscroll">
                    <pre className="ci-code">{displaySelected?.usageMarkdown ?? '— no usage info —'}</pre>
                  </div>
                  <button
                    className={`ci-copy-fab${copiedKey === 'usage' ? ' ci-copy-fab--done' : ''}`}
                    onClick={() => copy(displaySelected?.usageMarkdown ?? '', 'usage')}
                    title="Copy"
                  >
                    <CopyIcon />
                  </button>
                </div>
              )}

              {/* ── Code — single pane ── */}
              {displaySubMode === 'code' && !isAlwaysSplit && (
                <div className="ci-split-pane">
                  <div className="ci-pane-header">
                    {renderFilename(componentFiles[0]?.name ?? 'source')}
                  </div>
                  <div className="ci-content ci-content--noscroll">
                    <pre className="ci-code">{componentFiles[0]?.content ?? '— no files —'}</pre>
                  </div>
                  <button
                    className={`ci-copy-fab${copiedKey === 'code_0' ? ' ci-copy-fab--done' : ''}`}
                    onClick={() => copy(componentFiles[0]?.content ?? '', 'code_0')}
                    title="Copy"
                  >
                    <CopyIcon />
                  </button>
                </div>
              )}

              {/* ── Code — always split for 2+ files ── */}
              {displaySubMode === 'code' && isAlwaysSplit && (
                <div className="ci-split-view">
                  {componentFiles.map((f, i) => (
                    <div key={f.name} className="ci-split-pane">
                      <div className="ci-pane-header">
                        {renderFilename(f.name)}
                      </div>
                      <div className="ci-content ci-content--noscroll">
                        <pre className="ci-code">{f.content}</pre>
                      </div>
                      <button
                        className={`ci-copy-fab${copiedKey === `code_${i}` ? ' ci-copy-fab--done' : ''}`}
                        onClick={() => copy(f.content, `code_${i}`)}
                        title="Copy"
                      >
                        <CopyIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
