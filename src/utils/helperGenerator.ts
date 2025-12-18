import * as fs from 'fs';
import * as path from 'path';

export function generateFileHelper(baseDir: string = 'src'): void {
    const helpersDir = path.join(process.cwd(), baseDir, 'helpers');
    const filePath = path.join(helpersDir, 'fileHelper.ts');

    // Create helpers directory if it doesn't exist
    if (!fs.existsSync(helpersDir)) {
        fs.mkdirSync(helpersDir, { recursive: true });
        console.log(`✅ Created directory: ${helpersDir}`);
    }

    // Define the content for the file helper
    const content = `import fs from 'fs';
import path from 'path';

export const removeUploadedFiles = (file: any) => {
  if (!file) return;

  // Handle array of files
  if (Array.isArray(file)) {
    file.forEach(f => removeUploadedFiles(f));
    return;
  }
  
  // Handle file object (Multer)
  if (typeof file === 'object' && file.path) {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error('Error removing file:', error);
    }
    return;
  }

  // Handle string path (if stored as string)
  if (typeof file === 'string') {
    try {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error removing file:', error);
    }
  }
};
`;

    // Write file if it doesn't exist
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Created file: ${filePath}`);
    } else {
        console.log(`ℹ️  File already exists: ${filePath}`);
    }
}
