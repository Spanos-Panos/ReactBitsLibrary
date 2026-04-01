import React, { useState, useMemo } from 'react';
import { EnhancePromptButton } from './EnhancePromptButton';

interface ComponentItem {
  id: string;
  name: string;
  category: string;
  usageMarkdown: string;
}

interface ProjectBuilderPanelProps {
  selectedComponents: ComponentItem[];
  categoryLimits: Record<string, number>;
  prompt: string;
  onPromptChange: (val: string) => void;
  onGenerate: () => void;
  onRestoreFromHistory?: (prompt: string, selectedComponents: ComponentItem[]) => void;
}

const ProjectBuilderPanel: React.FC<ProjectBuilderPanelProps> = ({
  selectedComponents,
  categoryLimits,
  prompt,
  onPromptChange,
  onGenerate
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const categories = Object.keys(categoryLimits);

  const grouped = useMemo(() => {
    const res: Record<string, ComponentItem[]> = {};
    categories.forEach(cat => {
      res[cat] = selectedComponents.filter(c => c.category === cat);
    });
    return res;
  }, [selectedComponents, categories]);

  return (
    <div className="project-builder-pane">
      <header className="preview-header">
        <h3>Project Builder</h3>
        <span className="category-comment">// V0.2.2 Alpha</span>
      </header>

      <div className="builder-content">
        <label className="builder-label">Selected Elements</label>
        
        <div className="category-placeholders">
          {categories.map(cat => {
            const count = grouped[cat].length;
            const limit = categoryLimits[cat];
            const isExpanded = expandedCategories.includes(cat);

            return (
              <div key={cat} className={`category-summary-box ${count > 0 ? 'has-selection' : ''} ${isExpanded ? 'expanded' : ''}`}>
                <div 
                  className="category-summary-row" 
                  onClick={() => toggleCategory(cat)}
                >
                  <span className="cat-name">{cat}</span>
                  <div className="cat-status">
                    <span className={`cat-count ${count >= limit ? 'limit-reached' : ''}`}>
                      {count}/{limit}
                    </span>
                    <span className="expand-chevron">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="selected-elements-list mini">
                    {grouped[cat].length > 0 ? (
                      grouped[cat].map((item, i) => (
                        <div key={i} className="selected-element-tag">
                          {item.name}
                        </div>
                      ))
                    ) : (
                      <p className="builder-empty-text small">No {cat} selected.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="builder-section" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
            <label className="builder-label" style={{ marginBottom: 0 }}>AI Project Prompt</label>
            <EnhancePromptButton 
              rawPrompt={prompt}
              selectedComponents={selectedComponents}
              onSuccess={(result: any) => {
                if (result.success && result.enhancedPrompt?.generatorInstruction) {
                  onPromptChange(result.enhancedPrompt.generatorInstruction);
                }
              }}
            />
          </div>
          <textarea
            className="builder-textarea"
            placeholder="Describe the project you want to build with these components..."
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
          />
        </div>
      </div>

      <div className="builder-footer">
        <button 
          className="primary-btn generate-project-btn"
          onClick={onGenerate}
          disabled={selectedComponents.length === 0}
        >
          Generate Demo Project
        </button>
      </div>
    </div>
  );
};

export default ProjectBuilderPanel;
