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
  const content = `import fs from 'fs/promises';
import path from 'path';

async function removeFile(filenames: string | string[]) {
    if (!filenames || (Array.isArray(filenames) && filenames.length === 0)) return;

    // Normalize to array for consistent handling
    const files = Array.isArray(filenames) ? filenames : [filenames];

    for (const filename of files) {
        if (!filename) continue;

        // Remove leading '/images/' if included
        const cleanedName = filename.replace(/^\/?images\//, '');
        const filePath = path.join(process.cwd(), 'uploads', 'images', cleanedName);

        try {
            await fs.unlink(filePath);
            console.log(\`Deleted image: \${cleanedName}\`);
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                console.warn(\`File not found: \${cleanedName}\`);
            } else {
                console.error(\`Error deleting file \${cleanedName}:\`, err);
            }
        }
    }
}

export default removeFile;
`;

  // Write file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created file: ${filePath}`);
  } else {
    console.log(`ℹ️  File already exists: ${filePath}`);
  }
}
