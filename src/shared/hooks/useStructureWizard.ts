import { useState } from 'react';
import type { PageConfig } from '../types/index';

export interface StructureWizardState {
  isOpen: boolean;
  pages: PageConfig[];
  navbarId: string;
  projectName: string;
  outputPath: string;
  packageManager: 'npm' | 'pnpm' | 'yarn';
  open: (pages: PageConfig[], navbarId: string, suggestedName?: string) => void;
  close: () => void;
  setProjectName: (v: string) => void;
  setOutputPath: (v: string) => void;
  setPackageManager: (v: 'npm' | 'pnpm' | 'yarn') => void;
}

export function useStructureWizard(): StructureWizardState {
  const [isOpen, setIsOpen] = useState(false);
  const [pages, setPages] = useState<PageConfig[]>([]);
  const [navbarId, setNavbarId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [packageManager, setPackageManager] = useState<'npm' | 'pnpm' | 'yarn'>('npm');

  const open = (p: PageConfig[], id: string, suggestedName = '') => {
    setPages(p);
    setNavbarId(id);
    if (suggestedName) setProjectName(suggestedName);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  return {
    isOpen, pages, navbarId, projectName, outputPath, packageManager,
    open, close, setProjectName, setOutputPath, setPackageManager,
  };
}
