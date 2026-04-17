import type { ReactBitsItem } from "../types/index";

interface ComponentListPaneProps {
  displayedItems: ReactBitsItem[];
  selectedId: string | null;
  selectedIds: string[];
  hoveredComponentId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onHover: (id: string | null) => void;
  onAddClick: () => void;
}

export default function ComponentListPane({
  displayedItems,
  selectedId,
  selectedIds,
  hoveredComponentId,
  searchQuery,
  onSearchChange,
  onSelect,
  onToggleSelect,
  onHover,
  onAddClick,
}: ComponentListPaneProps) {
  return (
    <div className="component-list-pane" onMouseLeave={() => onHover(null)}>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <div className="search-bar-wrapper" style={{ flex: 1 }}>
          <span className="search-bar-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            className="search-bar-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="search-bar-clear" onClick={() => onSearchChange("")}>×</button>
          )}
        </div>
        <button
          title="Add component"
          onClick={onAddClick}
          style={{
            flexShrink: 0,
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(15, 23, 42, 0.6)",
            color: "#94a3b8",
            fontSize: "18px",
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.2s, border-color 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.35)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)";
          }}
        >+</button>
      </div>

      <div className="items-scroll-area">
        {displayedItems.map((item) => (
          <div
            key={item.id}
            className={`split-list-item ${hoveredComponentId === item.id ? "hovered" : ""} ${selectedId === item.id ? "active" : ""}`}
            onMouseEnter={() => onHover(item.id)}
            onClick={() => onSelect(item.id)}
          >
            <div className="split-list-item-content">
              <span className="split-list-item-title">{item.name}</span>
            </div>
            <div className="selection-container">
              <div
                className="checkbox-custom"
                onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id, e); }}
              >
                <input type="checkbox" checked={selectedIds.includes(item.id)} readOnly />
                <span className="checkmark"></span>
              </div>
              <span className="split-list-item-arrow">→</span>
            </div>
          </div>
        ))}
        {displayedItems.length === 0 && (
          <div className="empty-state">
            <p>{searchQuery ? `No results for "${searchQuery}"` : "No components found."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
