import { useState, useEffect, useRef } from 'react';
import type { DesignRules } from './ProjectBuilderPanel';
import type { LayoutConcept } from '../lib/layoutConceptGenerator';

export interface SavedPreset {
  id: string;
  name: string;
  savedAt: string;
  projectPrompt: string;
  selectedComponentIds: string[];
  designRules: DesignRules;
  layoutConcept: LayoutConcept | null;
  projectName: string;
  packageManager: string;
}

interface PresetManagerProps {
  onSave: (name: string) => Promise<void>;
  onLoad: (preset: SavedPreset) => void;
  onDelete: (id: string) => Promise<void>;
}

const api = () => (window as any).reactBitsApi;

export default function PresetManager({ onSave, onLoad, onDelete }: PresetManagerProps) {
  const [open, setOpen] = useState(false);
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadPresets = async () => {
    const list = await api()?.listPresets?.() ?? [];
    setPresets(list);
  };

  useEffect(() => {
    if (open) loadPresets();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim());
      setName('');
      await loadPresets();
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (preset: SavedPreset) => {
    onLoad(preset);
    setLoadedId(preset.id);
    setOpen(false);
    setTimeout(() => setLoadedId(null), 2000);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await onDelete(id);
    await loadPresets();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Save or load generator presets"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: open ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${open ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '8px',
          color: open ? '#a5b4fc' : '#94a3b8',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        Presets
        {presets.length > 0 && !open && (
          <span style={{
            background: 'rgba(99,102,241,0.35)',
            color: '#a5b4fc',
            borderRadius: '10px',
            padding: '1px 6px',
            fontSize: '10px',
            fontWeight: 600,
          }}>{presets.length}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          right: 0,
          width: '300px',
          background: 'rgba(10, 12, 20, 0.97)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          zIndex: 1000,
        }}>
          {/* Header */}
          <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 600, letterSpacing: '0.03em' }}>
              PRESETS
            </span>
          </div>

          {/* Save section */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="Preset name..."
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '7px',
                  color: '#e2e8f0',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                style={{
                  padding: '6px 12px',
                  background: name.trim() ? 'rgba(99,102,241,0.7)' : 'rgba(99,102,241,0.2)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  borderRadius: '7px',
                  color: name.trim() ? '#e0e7ff' : '#6366f1',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: name.trim() ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                {saving ? '...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Presets list */}
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {presets.length === 0 ? (
              <div style={{ padding: '20px 14px', color: '#475569', fontSize: '12px', textAlign: 'center' }}>
                No saved presets yet
              </div>
            ) : (
              presets.map(preset => (
                <div
                  key={preset.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: loadedId === preset.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {preset.name}
                    </div>
                    <div style={{ color: '#475569', fontSize: '10px', marginTop: '2px' }}>
                      {formatDate(preset.savedAt)} · {preset.selectedComponentIds.length} component{preset.selectedComponentIds.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => handleLoad(preset)}
                    style={{
                      padding: '4px 8px',
                      background: 'rgba(99,102,241,0.2)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: '5px',
                      color: '#a5b4fc',
                      fontSize: '11px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Load
                  </button>
                  <button
                    onClick={e => handleDelete(preset.id, e)}
                    style={{
                      padding: '4px 7px',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '5px',
                      color: '#f87171',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
