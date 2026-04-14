import React, { useMemo, useState } from 'react';
import { generateLayoutConcepts, type LayoutConcept } from '../lib/layoutConceptGenerator';
import { renderWireframeSVG } from '../lib/wireframeRenderer';

interface LayoutConceptPickerProps {
  selectedComponentNames: string[];
  currentConcept: LayoutConcept | null;
  onConfirm: (concept: LayoutConcept) => void;
  onClose: () => void;
}

const LayoutConceptPicker: React.FC<LayoutConceptPickerProps> = ({
  selectedComponentNames,
  currentConcept,
  onConfirm,
  onClose,
}) => {
  const concepts = useMemo(
    () => generateLayoutConcepts(selectedComponentNames),
    [selectedComponentNames.join(',')]
  );

  const [activeId, setActiveId] = useState<string | null>(currentConcept?.id ?? concepts[0]?.id ?? null);

  const activeConcept = concepts.find(c => c.id === activeId) ?? null;

  const svgs = useMemo(() => {
    const map: Record<string, string> = {};
    concepts.forEach(c => { map[c.id] = renderWireframeSVG(c); });
    return map;
  }, [concepts]);

  if (concepts.length === 0) {
    return (
      <div className="layout-picker-overlay" onClick={onClose}>
        <div className="layout-picker-modal" onClick={e => e.stopPropagation()}>
          <div className="layout-picker-empty">
            <p>Select at least 2 components to generate layout concepts.</p>
            <button className="secondary-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-picker-overlay" onClick={onClose}>
      <div className="layout-picker-modal" onClick={e => e.stopPropagation()}>

        <header className="layout-picker-header">
          <div className="window-controls">
            <span className="dot red" onClick={onClose} style={{ cursor: 'pointer' }}></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <h2>Layout Concepts</h2>
          <span className="layout-picker-subtitle">Based on your {selectedComponentNames.length} selected components</span>
        </header>

        <div className="layout-picker-body">

          {/* Concept cards */}
          <div className="layout-concept-cards">
            {concepts.map(concept => (
              <div
                key={concept.id}
                className={`layout-concept-card ${activeId === concept.id ? 'active' : ''}`}
                onClick={() => setActiveId(concept.id)}
              >
                <div
                  className="layout-wireframe"
                  dangerouslySetInnerHTML={{ __html: svgs[concept.id] }}
                />
                <div className="layout-concept-info">
                  <span className="layout-concept-name">{concept.name}</span>
                  <p className="layout-concept-desc">{concept.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel for active concept */}
          {activeConcept && (
            <div className="layout-concept-detail">
              <span className="layout-detail-label">Zone Breakdown</span>
              <div className="layout-zone-list">
                {activeConcept.zones.filter(z => z.heightHint !== 'overlay').map((zone, i) => (
                  <div key={i} className={`layout-zone-item layout-zone-role-${zone.role.replace('-', '')}`}>
                    <span className="zone-index">{i + 1}</span>
                    <div className="zone-info">
                      <span className="zone-name">{zone.componentName}</span>
                      <span className="zone-role">{zone.role}</span>
                    </div>
                    <span className="zone-height">{zone.heightHint}</span>
                  </div>
                ))}
                {activeConcept.zones.filter(z => z.heightHint === 'overlay').length > 0 && (
                  <div className="layout-zone-overlays">
                    <span className="zone-overlay-label">Overlays:</span>
                    {activeConcept.zones.filter(z => z.heightHint === 'overlay').map((z, i) => (
                      <span key={i} className="zone-overlay-tag">{z.componentName}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="layout-picker-footer">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button
            className="primary-btn"
            onClick={() => activeConcept && onConfirm(activeConcept)}
            disabled={!activeConcept}
          >
            Use "{activeConcept?.name}"
          </button>
        </div>

      </div>
    </div>
  );
};

export default LayoutConceptPicker;
