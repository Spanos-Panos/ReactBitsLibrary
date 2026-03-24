import { join } from 'path';
import { generateViteReact } from './generators/vite-react.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GenerateOptions {
  installMethod: 'cli' | 'manual';
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  installData: any;
  projectName: string;
  projectPath: string;
  openWhenDone: boolean;
}

export async function generatePlayground(
  category: string, 
  name: string, 
  usageCode: string, 
  componentFiles: { name: string, content: string }[], 
  options: GenerateOptions
) {
  try {
    const fullPath = join(options.projectPath, options.projectName);
    
    // 1. Scaffold the project and inject code
    await generateViteReact({
      targetDir: fullPath,
      projectName: options.projectName,
      componentCategory: category,
      componentName: name,
      componentFiles,
      usageCode,
      packageManager: options.packageManager,
      installData: options.installData,
    });

    let vsCodeMsg = "";
    // 2. Open in VS Code if requested
    if (options.openWhenDone) {
      try {
        await execAsync(`code .`, { cwd: fullPath });
      } catch (err) {
        console.warn("Failed to open VS Code:", err);
        vsCodeMsg = "\n(Note: Visual Studio Code needed! 'code .' command failed.)";
      }
    }

    return { 
      success: true, 
      path: fullPath,
      message: `Success! Project created at:\n${fullPath}${vsCodeMsg}`
    };
  } catch (error: any) {
    console.error("Failed to generate project:", error);
    return { success: false, error: error.message };
  }
}
