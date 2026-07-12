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

let updatedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  // Replace manual 500 error catches with next(error)
  content = content.replace(/catch\s*\(\s*(error|err)\s*(:\s*any)?\s*\)\s*\{\s*res\.status\(\d+\)\.json\(\{\s*error:[^}]+\}\);\s*\}/g, 'catch ($1: any) {\n      next($1);\n    }');
  content = content.replace(/catch\s*\(\s*(error|err)\s*(:\s*any)?\s*\)\s*\{\s*return res\.status\(\d+\)\.json\(\{\s*error:[^}]+\}\);\s*\}/g, 'catch ($1: any) {\n      next($1);\n    }');

  // Replace success responses
  content = content.replace(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*data:\s*([^,]+)(?:,\s*)?\}\);/g, 'JSend.success(res, 200, $1);');
  content = content.replace(/res\.status\(201\)\.json\(\{\s*success:\s*true,\s*data:\s*([^,]+)(?:,\s*)?\}\);/g, 'JSend.success(res, 201, $1, "Recurso creado exitosamente");');
  
  // Update signature to include next: NextFunction if next is used
  if (content.includes('next(') && !content.includes('NextFunction')) {
    if (content.includes('Request, Response')) {
      content = content.replace('Request, Response', 'Request, Response, NextFunction');
    }
    if (content.includes('req: Request, res: Response)')) {
      content = content.replace('req: Request, res: Response)', 'req: Request, res: Response, next: NextFunction)');
    }
    if (content.includes('_req: Request, res: Response)')) {
      content = content.replace('_req: Request, res: Response)', '_req: Request, res: Response, next: NextFunction)');
    }
  }
  
  // Import NextFunction if not imported
  if (content.includes('NextFunction') && !content.includes('NextFunction } from "express"')) {
    content = content.replace(/import\s*\{\s*Request,\s*Response\s*\}\s*from\s*"express";/, 'import { Request, Response, NextFunction } from "express";');
  }

  // Import JSend if used
  if (content.includes('JSend.') && !content.includes('JSend"')) {
    const depth = (file.match(/\\/g) || []).length - (path.join(__dirname, '../src/modules').match(/\\/g) || []).length;
    const prefix = Array(depth + 1).fill('..').join('/');
    content = `import { JSend } from "${prefix}/shared/utils/JSend";\n` + content;
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    updatedCount++;
  }
}

console.log(`Updated ${updatedCount} files.`);
