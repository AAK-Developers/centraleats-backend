import fs from 'fs';
import path from 'path';

function walk(dir: string, filelist: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filelist);
    } else if (filepath.endsWith('.ts')) {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const files = walk(path.join(__dirname, '../src/modules'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('import { JSend }')) {
    // Calculate relative path to src/shared/utils/JSend.ts
    const targetPath = path.join(__dirname, '../src/shared/utils/JSend.ts');
    let relPath = path.relative(path.dirname(file), targetPath).replace(/\\/g, '/').replace('.ts', '');
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    content = content.replace(/import \{ JSend \} from "([^"]+)";/g, `import { JSend } from "${relPath}";`);
    fs.writeFileSync(file, content);
    console.log(`Fixed import in ${file}: ${relPath}`);
  }
}
