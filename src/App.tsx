import { useEffect, useMemo, useState } from "react";
import manifest from "./reactbits-manifest.json";
import Iridescence from "./components/Backgrounds/Iridescence/Iridescence";
import GradientText from "./components/TextAnimations/GradientText/GradientText";
import FlowingMenu from "./components/Components/FlowingMenu/FlowingMenu";
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

function App() {
  const [items] = useState<ReactBitsItem[]>(manifest);
  const [view, setView] = useState<"gallery" | "detail">("gallery");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [componentFiles, setComponentFiles] = useState<{ name: string; content: string }[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [generateStatus, setGenerateStatus] = useState<string>("");

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
    setView("detail");
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
            color={[0, 0.7, 0.7]}
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
          <main className="gallery-container">
            <div className="filter-bar">
              <GradientText
                colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
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
                  <div className="back-nav-container">
                    <button className="back-to-types" onClick={() => setActiveCategory("all")}>
                      ← Back to Types
                    </button>
                    <span className="current-sub-category">{CATEGORY_LABELS[activeCategory]}</span>
                  </div>

                  <div className="comp-grid">
                    {filtered.map((item) => (
                      <div key={item.id} className="comp-card" onClick={() => handleSelectComponent(item.id)}>
                        <div className="comp-card-hover-bg"></div>
                        <div className="comp-card-content">
                          <span className="comp-category">{item.category}</span>
                          <SplitText
                            text={item.name}
                            className="comp-title"
                            delay={70}
                            duration={1}
                            ease="power3.out"
                            splitType="chars"
                            onLetterAnimationComplete={() => {
                              console.log("Animation complete for:", item.name);
                              const toast = document.createElement("div");
                              toast.className = "completion-toast";
                              toast.innerText = `Animation Complete: ${item.name}`;
                              document.body.appendChild(toast);
                              setTimeout(() => toast.remove(), 2000);
                            }}
                          />
                        </div>
                        <div className="comp-card-arrow">→</div>
                      </div>
                    ))}
                    {filtered.length === 0 && (
                      <div className="empty-state">
                        <h2>No results found</h2>
                        <p>Try searching for something else or changing categories.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </section>

        {/* Detail Scene */}
        <section className={`scene detail-view ${view === "detail" ? "" : "hidden-right"}`}>
          {selected && (
            <>
              <nav className="detail-nav">
                <button className="back-btn" onClick={handleBackToGallery}>
                  <span>←</span> Back to Showcase
                </button>
                <div style={{ textAlign: "right" }}>
                  <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{selected.name}</h2>
                  <span className="tag">{selected.category}</span>
                </div>
              </nav>

              <main className="detail-main">
                <div className="inspector-side">
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

                  <div className="code-viewer">
                    <pre className="code-view">
                      {activeFileIndex === -1
                        ? selected.usageMarkdown
                        : componentFiles[activeFileIndex]?.content || "No content available."}
                    </pre>
                  </div>

                  <div className="action-buttons">
                    <button className="primary-btn" onClick={handleGenerate}>
                      Generate Project with {selected.name}
                    </button>
                    <button
                      className="secondary-btn"
                      onClick={() => {
                        const content = activeFileIndex === -1 ? selected.usageMarkdown : componentFiles[activeFileIndex].content;
                        navigator.clipboard.writeText(content);
                        alert("Copied to clipboard!");
                      }}
                    >
                      Copy Code
                    </button>
                  </div>
                  {generateStatus && (
                    <div style={{ padding: '0 1.5rem 1.5rem' }}>
                      <div style={{ padding: '0.8rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '0.5rem', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                        {generateStatus}
                      </div>
                    </div>
                  )}
                </div>

                <div className="showcase-side">
                  <div className="preview-container">
                    <div className="preview-placeholder">
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                      <h3>Component Preview</h3>
                      <p>Full-screen interactive previews coming soon.</p>
                    </div>
                  </div>
                </div>
              </main>
            </>
          )}
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

