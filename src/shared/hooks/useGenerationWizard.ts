import { useState } from 'react';

/**
 * Owns all UI state for the project-generation wizard modal.
 * `confirmGenerate` and `handleBuilderGenerate` stay in App.tsx because they
 * are cross-cutting orchestrators that depend on loader + task + wizard state.
 */
export function useGenerationWizard() {
  const [showGenerateWizard, setShowGenerateWizard] = useState(false);
  const [projectName, setProjectName]   = useState('');
  const [projectPath, setProjectPath]   = useState('');
  const [installTab, setInstallTab]     = useState<'cli' | 'manual'>('cli');
  const [packageManager, setPackageManager] = useState<'pnpm' | 'npm' | 'yarn' | 'bun'>('npm');
  const [openWhenDone, setOpenWhenDone] = useState(true);
  const [runWhenDone, setRunWhenDone]   = useState(false);

  const handleSelectDirectory = async () => {
    const path = await window.reactBitsApi?.selectDirectory?.();
    if (path) setProjectPath(path);
  };

  return {
    showGenerateWizard, setShowGenerateWizard,
    projectName,        setProjectName,
    projectPath,        setProjectPath,
    installTab,         setInstallTab,
    packageManager,     setPackageManager,
    openWhenDone,       setOpenWhenDone,
    runWhenDone,        setRunWhenDone,
    handleSelectDirectory,
  };
}
