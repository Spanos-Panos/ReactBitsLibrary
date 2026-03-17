import { useEffect, useMemo, useState } from "react";
import manifest from "./reactbits-manifest.json";
import Iridescence from "./components/Backgrounds/Iridescence/Iridescence";
import GradientText from "./components/TextAnimations/GradientText/GradientText";
import FlowingMenu from "./components/Components/FlowingMenu/FlowingMenu";
import PillNav from "./components/Components/PillNav/PillNav";
import SplitText from "./components/TextAnimations/SplitText/SplitText";

type ReactBitsItem = (typeof manifest)[number];

const CATEGORY_LABELS: Record<string, string> = {
  Components: "Components",
  Animations: "Animations",
  Backgrounds: "Backgrounds",
  TextAnimations: "Text animations",
};

function groupByCategory(items: ReactBitsItem[]): Record<string, ReactBitsItem[]> {
  return items.reduce<Record<string, ReactBitsItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

const GRADIENT_COLORS = ["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"];

const PILL_NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'Components', label: 'Components' },
  { id: 'Animations', label: 'Animations' },
  { id: 'TextAnimations', label: 'Text Animations' },
  { id: 'Backgrounds', label: 'Backgrounds' }
];

const IRIDESCENCE_COLOR: [number, number, number] = [0, 0.7, 0.7];

function App() {
  const [items] = useState<ReactBitsItem[]>(manifest);
  const [view, setView] = useState<"gallery" | "detail">("gallery");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [componentFiles, setComponentFiles] = useState<{ name: string; content: string }[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [generateStatus, setGenerateStatus] = useState<string>("");
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);

  // Performance / Low Power Mode
  const [lowPowerMode, setLowPowerMode] = useState(() => {
    return localStorage.getItem("lowPowerMode") === "true";
  });

  const toggleLowPowerMode = () => {
    setLowPowerMode(prev => {
      const next = !prev;
      localStorage.setItem("lowPowerMode", String(next));
      return next;
    });
  };

  // Chat UI states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "system" | "user"; text: string }[]>([
    {
      role: "system",
      text: "Hello! I am your AI assistant. Select the components you'd like to use and tell me what you want to build!",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [selectedChatComponents, setSelectedChatComponents] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      return activeCategory === "all" || item.category === activeCategory;
    });
  }, [items, activeCategory]);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (selected && (window as any).reactBitsApi?.getComponentFiles) {
      const files = (window as any).reactBitsApi.getComponentFiles(selected.category, selected.name);
      setComponentFiles(files);
      // Try to find the .tsx or .jsx file to show first
      const mainIdx = files.findIndex((f: any) => f.name.endsWith(".tsx") || f.name.endsWith(".jsx"));
      setActiveFileIndex(mainIdx !== -1 ? mainIdx : 0);
    } else {
      setComponentFiles([]);
      setActiveFileIndex(0);
    }
  }, [selectedId]);

  const handleSelectComponent = (id: string) => {
    setSelectedId(id);
    setGenerateStatus("");
  };

  const handleBackToGallery = () => {
    setView("gallery");
  };

  const handleGenerate = async () => {
    if (!selected || !(window as any).reactBitsApi?.generatePlayground) return;
    setGenerateStatus("Generating...");
    try {
      const result = await (window as any).reactBitsApi.generatePlayground(
        selected.category,
        selected.name,
        selected.usageMarkdown,
        componentFiles
      );
      if (result.success) {
        setGenerateStatus(`Success! Project created at:\n${result.path}`);
      } else {
        setGenerateStatus(`Failed: ${result.error || "Unknown error"}`);
      }
    } catch (e: any) {
      setGenerateStatus(`Error: ${e.message}`);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages((prev) => [...prev, { role: "user", text: chatInput }]);

    // Simulate AI response for now
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "system",
          text: `I've received your prompt to build something using [${selectedChatComponents.join(", ") || "no components"
            }]. Since I'm currently running in UI shell mode without an API key, I can't generate the full frontend yet, but this is where the logic will run!`,
        },
      ]);
    }, 800);

    setChatInput("");
  };

  return (
    <div className="app-root">
      <div className="background-container">
        {!lowPowerMode && (
          <Iridescence
            color={IRIDESCENCE_COLOR}
            mouseReact={false}
            amplitude={0.1}
            speed={0.3}
          />
        )}
      </div>

      <button 
        className={`performance-toggle ${lowPowerMode ? 'active' : ''}`}
        onClick={toggleLowPowerMode}
        title={lowPowerMode ? "Disable Low Power Mode" : "Enable Low Power Mode"}
      >
        {lowPowerMode ? "🚀 High Perf" : "🔋 Low Power"}
      </button>
      <div className="scene-container">
        {/* Gallery Scene */}
        <section className={`scene ${view === "gallery" ? "" : "hidden-left"}`}>
          <main className={`gallery-container ${activeCategory === "all" ? "no-scroll" : ""}`}>
            <div className="filter-bar">
              <GradientText
                colors={GRADIENT_COLORS}
                animationSpeed={10}
                showBorder={false}
                className="modern-title"
              >
                ReactBits Explorer
              </GradientText>
            </div>

            <div className="comp-showcase-container">
              {activeCategory === "all" ? (
                <FlowingMenu
                  items={Object.keys(CATEGORY_LABELS).map(cat => ({
                    text: CATEGORY_LABELS[cat],
                    onClick: () => setActiveCategory(cat)
                  }))}
                />
              ) : (
                <div className="sub-menu-container">
                  <div className="back-nav-container" style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
                    <PillNav
                      items={PILL_NAV_ITEMS}
                      activeId={activeCategory}
                      onItemClick={(id: string) => {
                        if (id === 'home') {
                          setActiveCategory('all');
                        } else {
                          setActiveCategory(id);
                        }
                      }}
                      baseColor="#94a3b8"
                      pillColor="rgba(15, 23, 42, 0.6)"
                      hoveredPillTextColor="#ffffff"
                      pillTextColor="#e2e8f0"
                    />
                  </div>

                  <div className="split-view-container">
                    <div className="component-list-pane" onMouseLeave={() => setHoveredComponentId(null)}>
                      {filtered.map((item) => (
                        <div 
                          key={item.id} 
                          className={`split-list-item ${hoveredComponentId === item.id ? 'hovered' : ''}`}
                          onMouseEnter={() => setHoveredComponentId(item.id)}
                          onClick={() => handleSelectComponent(item.id)}
                        >
                          <div className="split-list-item-content">
                            <span className="split-list-item-title">{item.name}</span>
                          </div>
                          <span className="split-list-item-arrow">→</span>
                        </div>
                      ))}
                      {filtered.length === 0 && (
                        <div className="empty-state">
                          <p>No components found.</p>
                        </div>
                      )}
                    </div>

                    <div className="component-preview-pane">
                      {selected ? (
                        <div className="preview-content-active">
                          <header className="preview-header">
                            <div className="header-title-row">
                              <h3>{selected.name}</h3>
                              <span className="tag">{selected.category}</span>
                            </div>
                            <div className="inspector-tabs">
                              {componentFiles.map((f, i) => (
                                <div
                                  key={i}
                                  className={`inspector-tab ${activeFileIndex === i ? "active" : ""}`}
                                  onClick={() => setActiveFileIndex(i)}
                                >
                                  {f.name}
                                </div>
                              ))}
                              <div
                                className={`inspector-tab ${activeFileIndex === -1 ? "active" : ""}`}
                                onClick={() => setActiveFileIndex(-1)}
                              >
                                Usage
                              </div>
                            </div>
                          </header>

                          <div className="code-viewer preview-code-box">
                            <pre className="code-view">
                              {activeFileIndex === -1
                                ? selected.usageMarkdown
                                : componentFiles[activeFileIndex]?.content || "No content available."}
                            </pre>
                          </div>

                          <div className="action-buttons preview-actions">
                            <button className="primary-btn" onClick={handleGenerate}>
                              Generate Project with {selected.name}
                            </button>
                            <button
                              className="secondary-btn"
                              onClick={() => {
                                const content = activeFileIndex === -1 ? selected.usageMarkdown : componentFiles[activeFileIndex]?.content || "";
                                navigator.clipboard.writeText(content);
                                alert("Copied to clipboard!");
                              }}
                            >
                              Copy Code
                            </button>
                          </div>
                          {generateStatus && (
                            <div className="status-toast">
                              {generateStatus}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="preview-placeholder">
                          <header className="preview-header">
                            <h3>
                              {hoveredComponentId 
                                ? (filtered.find(i => i.id === hoveredComponentId)?.name || 'Preview')
                                : 'Select a component'}
                            </h3>
                            <div className="mock-tabs" style={{ opacity: hoveredComponentId ? 1 : 0.3, transition: 'opacity 0.3s' }}>
                              <span className="mock-tab active">React</span>
                              <span className="mock-tab">CSS</span>
                              <span className="mock-tab">Tailwind</span>
                            </div>
                          </header>
                          <div className="preview-box">
                            <span className="preview-text">
                              {hoveredComponentId 
                                ? 'Click to view code and information' 
                                : 'Hover over a component to view information'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </section>


      </div>

      {/* Floating Action Button */}
      <button className="fab-button" onClick={() => setIsChatOpen(!isChatOpen)} title="Open AI Generator">
        ✨
      </button>

      {/* Chat Slide-over Panel */}
      <aside className={`chat-panel ${isChatOpen ? "open" : ""}`}>
        <header className="chat-header">
          <h2>AI Frontend Generator</h2>
          <button className="close-btn" onClick={() => setIsChatOpen(false)}>
            &times;
          </button>
        </header>

        <div className="chat-body">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              {msg.text}
            </div>
          ))}
        </div>

        <form className="chat-footer" onSubmit={handleChatSubmit}>
          <select
            multiple
            className="chat-select"
            value={selectedChatComponents}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions, (option) => option.value);
              setSelectedChatComponents(opts);
            }}
            title="Hold Ctrl/Cmd to select multiple components"
          >
            {items.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <div className="chat-input-row">
            <input
              type="text"
              className="chat-input"
              placeholder="Describe your layout..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="chat-submit">
              Send
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default App;

