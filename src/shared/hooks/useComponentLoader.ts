import { useState, useEffect } from 'react';
import manifest from '../../reactbits-manifest.json';
import type { ReactBitsItem, ComponentFile, ParsedInstallData } from '../types/index';


/**
 * Owns the component catalogue, the selected item, and the side effects that
 * load that item's source files and installation instructions.
 */
export function useComponentLoader() {
  const [items, setItems] = useState<ReactBitsItem[]>(manifest as ReactBitsItem[]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [componentFiles, setComponentFiles] = useState<ComponentFile[]>([]);
  const [parsedInstallData, setParsedInstallData] = useState<ParsedInstallData>({ cli: {}, manual: {} });
  const [rawInstallMarkdown, setRawInstallMarkdown] = useState('');

  const selected = items.find(i => i.id === selectedId) ?? null;

  // Load source files whenever the selected component changes
  useEffect(() => {
    if (!selected || !window.reactBitsApi?.getComponentFiles) {
      setComponentFiles([]);
      return;
    }
    let files = window.reactBitsApi.getComponentFiles(
      selected.category,
      selected.name,
      selected.library ?? 'reactbits',
    );
    files = files
      .filter(f => !f.name.endsWith('.md'))
      .sort((a, b) => {
        const aIsMain = a.name.endsWith('.tsx') || a.name.endsWith('.jsx');
        const bIsMain = b.name.endsWith('.tsx') || b.name.endsWith('.jsx');
        const aIsCss  = a.name.endsWith('.css');
        const bIsCss  = b.name.endsWith('.css');
        if (aIsMain && !bIsMain) return -1;
        if (!aIsMain && bIsMain) return  1;
        if (aIsCss  && !bIsCss)  return -1;
        if (!aIsCss  && bIsCss)  return  1;
        return a.name.localeCompare(b.name);
      });
    setComponentFiles(files);
  }, [selectedId]); // intentional: re-run only on ID change, not on items update

  // Fetch and parse the installation markdown for the selected component
  useEffect(() => {
    if (!selected) {
      setParsedInstallData({ cli: {}, manual: {} });
      setRawInstallMarkdown('');
      return;
    }
    const root = selected.library === 'universal' ? 'UniversalComponents' : 'ReactBitsComponents';
    const installPath = `${root}/${selected.id}/${selected.name}Install.md`;
    fetch(installPath)
      .then(res => res.text())
      .then(text => {
        setRawInstallMarkdown(text);
        const data: ParsedInstallData = { cli: {}, manual: {} };
        let currentBlock: 'cli' | 'manual' | null = null;
        text.split(/\r?\n/).forEach(line => {
          const t = line.trim();
          if (t.toLowerCase() === 'cli') currentBlock = 'cli';
          else if (t.toLowerCase() === 'manual') currentBlock = 'manual';
          else if (t.includes('=') && currentBlock) {
            const eq = t.indexOf('=');
            const k  = t.substring(0, eq).trim().toLowerCase();
            const v  = t.substring(eq + 1).trim();
            if (k && v) data[currentBlock][k] = v;
          }
        });
        setParsedInstallData(data);
      })
      .catch(() => {
        setParsedInstallData({ cli: {}, manual: {} });
        setRawInstallMarkdown('// Failed to load installation instructions.');
      });
  }, [selected]);

  return {
    items,
    setItems,
    selectedId,
    setSelectedId,
    selected,
    componentFiles,
    parsedInstallData,
    rawInstallMarkdown,
  };
}
