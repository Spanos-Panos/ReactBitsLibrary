import { useState } from "react";

type Category = "Components" | "Animations" | "Backgrounds" | "TextAnimations";
type Language = "ts-css" | "ts-tailwind" | "js-css" | "js-tailwind";

const PMS = ["pnpm", "npm", "yarn", "bun"] as const;
type PM = typeof PMS[number];

interface InstallCommands { pnpm: string; npm: string; yarn: string; bun: string; }
const EMPTY_CMDS = (): InstallCommands => ({ pnpm: "", npm: "", yarn: "", bun: "" });

function buildInstallMarkdown(cli: InstallCommands, manual: InstallCommands): string {
  const lines: string[] = ["CLI"];
  for (const pm of PMS) { if (cli[pm].trim()) lines.push(`${pm} = ${cli[pm].trim()}`); }
  lines.push("", "Manual");
  for (const pm of PMS) { if (manual[pm].trim()) lines.push(`${pm} = ${manual[pm].trim()}`); }
  return lines.join("\n");
}

interface NewEntry {
  id: string;
  name: string;
  category: string;
  usageMarkdown: string;
  relativePath: string;
}

interface AddComponentModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: (entry: NewEntry) => void;
}

const CATEGORIES: Category[] = ["Components", "Animations", "Backgrounds", "TextAnimations"];
const LANGUAGES: { value: Language; label: string }[] = [
  { value: "ts-css",      label: "TS + CSS"      },
  { value: "ts-tailwind", label: "TS + Tailwind"  },
  { value: "js-css",      label: "JS + CSS"       },
  { value: "js-tailwind", label: "JS + Tailwind"  },
];

const TEXTAREA_STYLE: React.CSSProperties = {
  width: "100%",
  minHeight: "120px",
  resize: "vertical",
  background: "rgba(15, 23, 42, 0.7)",
  color: "#e2e8f0",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "10px 12px",
  fontFamily: "'Fira Code', 'Cascadia Code', monospace",
  fontSize: "12px",
  lineHeight: "1.6",
  outline: "none",
  boxSizing: "border-box",
};

const INPUT_STYLE: React.CSSProperties = {
  flex: 1,
  background: "rgba(15, 23, 42, 0.7)",
  color: "#e2e8f0",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "6px",
  padding: "6px 10px",
  fontFamily: "'Fira Code', 'Cascadia Code', monospace",
  fontSize: "12px",
  outline: "none",
  boxSizing: "border-box" as const,
  minWidth: 0,
};

function InstallSection({
  title, commands, onChange,
}: { title: string; commands: InstallCommands; onChange: (pm: PM, val: string) => void }) {
  return (
    <div style={{ marginBottom: "6px" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {PMS.map((pm) => (
          <div key={pm} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "36px", fontSize: "11px", color: "#94a3b8", flexShrink: 0 }}>{pm}</span>
            <input
              style={INPUT_STYLE}
              type="text"
              placeholder={title === "CLI" ? `e.g. pnpm dlx shadcn@latest add MyComp` : `e.g. pnpm add some-package`}
              value={commands[pm]}
              onChange={(e) => onChange(pm, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AddComponentModal({ open, onClose, onAdded }: AddComponentModalProps) {
  const [name, setName]         = useState("");
  const [category, setCategory] = useState<Category>("Components");
  const [language, setLanguage] = useState<Language>("ts-css");
  const [code, setCode]         = useState("");
  const [css, setCss]           = useState("");
  const [cliCmds, setCliCmds]     = useState<InstallCommands>(EMPTY_CMDS);
  const [manualCmds, setManualCmds] = useState<InstallCommands>(EMPTY_CMDS);
  const [usage, setUsage]       = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  if (!open) return null;

  const isTailwind = language.includes("tailwind");

  const handleSubmit = async () => {
    setError("");
    const trimmedName = name.trim().replace(/[^a-zA-Z0-9]/g, "");
    if (!trimmedName) { setError("Name is required (letters and numbers only)."); return; }
    if (!code.trim())  { setError("Component code is required."); return; }

    const install = buildInstallMarkdown(cliCmds, manualCmds);

    setLoading(true);
    try {
      const result = await (window as any).reactBitsApi?.addComponent({
        name: trimmedName, category, language, code, css, install, usage,
      });
      if (result?.ok) {
        onAdded(result.entry);
        resetForm();
        onClose();
      } else {
        setError(result?.error || "Unknown error");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(""); setCategory("Components"); setLanguage("ts-css");
    setCode(""); setCss(""); setCliCmds(EMPTY_CMDS()); setManualCmds(EMPTY_CMDS()); setUsage(""); setError("");
  };

  const handleClose = () => { resetForm(); onClose(); };

  return (
    <div className="wizard-overlay" onClick={handleClose}>
      <div
        className="wizard-modal"
        style={{ maxWidth: "640px", width: "94vw", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="wizard-header">
          <div className="window-controls">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <h2>Add Component</h2>
          <button className="close-btn" onClick={handleClose}>&times;</button>
        </header>

        <div className="wizard-body">
          {/* Name */}
          <div className="wizard-section">
            <label>Component Name</label>
            <input
              className="wizard-input"
              type="text"
              placeholder="e.g. GlowCard"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="wizard-section">
            <label>Category</label>
            <div className="inspector-tabs secondary-level" style={{ marginTop: "6px" }}>
              {CATEGORIES.map((cat) => (
                <div
                  key={cat}
                  className={`inspector-tab ${category === cat ? "active" : ""}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </div>
              ))}
            </div>
          </div>

          {/* Install — structured form */}
          <div className="wizard-section">
            <label>Install Instructions</label>
            <div style={{
              marginTop: "8px",
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}>
              <InstallSection
                title="CLI"
                commands={cliCmds}
                onChange={(pm, val) => setCliCmds(prev => ({ ...prev, [pm]: val }))}
              />
              <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
              <InstallSection
                title="Manual"
                commands={manualCmds}
                onChange={(pm, val) => setManualCmds(prev => ({ ...prev, [pm]: val }))}
              />
            </div>
          </div>

          {/* Usage */}
          <div className="wizard-section">
            <label>Usage Example (Usage.md)</label>
            <textarea
              style={{ ...TEXTAREA_STYLE, minHeight: "120px", marginTop: "6px" }}
              placeholder={"import GlowCard from './GlowCard';\n\nexport default function App() {\n  return <GlowCard>Hello</GlowCard>;\n}"}
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
            />
          </div>

          {/* Language */}
          <div className="wizard-section">
            <label>Language</label>
            <div className="inspector-tabs secondary-level" style={{ marginTop: "6px" }}>
              {LANGUAGES.map(({ value, label }) => (
                <div
                  key={value}
                  className={`inspector-tab ${language === value ? "active" : ""}`}
                  onClick={() => setLanguage(value)}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Component Code */}
          <div className="wizard-section">
            <label>Component Code (.{language.startsWith("ts") ? "tsx" : "jsx"})</label>
            <textarea
              style={{ ...TEXTAREA_STYLE, minHeight: "160px", marginTop: "6px" }}
              placeholder={`// Paste your ${language.startsWith("ts") ? "TypeScript" : "JavaScript"} component code here`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {/* CSS — hidden for Tailwind */}
          {!isTailwind && (
            <div className="wizard-section">
              <label>CSS (.css)</label>
              <textarea
                style={{ ...TEXTAREA_STYLE, minHeight: "100px", marginTop: "6px" }}
                placeholder="/* Paste component CSS here */"
                value={css}
                onChange={(e) => setCss(e.target.value)}
              />
            </div>
          )}

          {error && (
            <p style={{ color: "#f87171", fontSize: "13px", margin: "4px 0 0" }}>{error}</p>
          )}
        </div>

        <div className="wizard-actions">
          <button className="secondary-btn" onClick={handleClose} disabled={loading}>Cancel</button>
          <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Component"}
          </button>
        </div>
      </div>
    </div>
  );
}
