import { useMemo } from "react";
import type { ReactBitsItem } from "../../shared/types/index";
import AnimatedList from "../../showcase/UIComponents/AnimatedList/AnimatedList";
import { getWeight } from "../../shared/data/componentRoles";

const CATEGORY_ORDER = [
  { id: "Components",       label: "Components" },
  { id: "Animations",       label: "Animations" },
  { id: "TextAnimations",   label: "Text Animations" },
  { id: "Backgrounds",      label: "Backgrounds" },
  { id: "UniversalButtons", label: "Universal · Buttons" },
  { id: "UniversalCards",   label: "Universal · Cards" },
];

interface ComponentListPaneProps {
  items: ReactBitsItem[];
  selectedId: string | null;
  selectedIds: string[];
  searchQuery: string;
  activeCategory: string;
  onSelect: (id: string) => void;
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onHover: (id: string | null) => void;
}

export default function ComponentListPane({
  items,
  selectedId,
  selectedIds,
  searchQuery,
  activeCategory,
  onSelect,
  onToggleSelect,
  onHover,
}: ComponentListPaneProps) {
  const q = searchQuery.trim().toLowerCase();

  const sections = useMemo(() =>
    CATEGORY_ORDER.map(cat => ({
      id: cat.id,
      label: cat.label,
      items: items
        .filter(i => i.category === cat.id && (!q || i.name.toLowerCase().includes(q)))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(i => ({ id: i.id, name: i.name, weight: getWeight(i.name) })),
    })),
    [items, q]
  );

  return (
    <div className="component-list-pane">
      <div className="clp-header">
        <span className="clp-title">Components</span>
      </div>

      <AnimatedList
        sections={sections}
        selectedId={selectedId}
        selectedIds={selectedIds}
        activeCategory={activeCategory}
        onItemClick={onSelect}
        onItemHover={onHover}
        onItemCheck={onToggleSelect}
        showGradients
      />
    </div>
  );
}
