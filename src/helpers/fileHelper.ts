import fs from 'fs';
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
