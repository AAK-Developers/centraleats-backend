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

  // For metrics controllers
  content = content.replace(/res\.status\(404\)\.json\(\{\s*success:\s*false,\s*message:\s*"([^"]+)",\s*data:\s*null\s*\}\);/g, 'return JSend.error(res, 404, "$1");');
  content = content.replace(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*message:\s*"([^"]+)",\s*data\s*\}\);/g, 'JSend.success(res, 200, data, "$1");');
  
  // For standard success with spread objects or multiple lines
  // E.g. res.status(200).json({ success: true, ... });
  // To avoid complexity, we can use specific replacements:
  content = content.replace(/res\.status\(201\)\.json\(\{\s*success:\s*true,\s*data:\s*order\s*\}\);/g, 'JSend.success(res, 201, order, "Orden creada");');
  content = content.replace(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*data:\s*order\s*\}\);/g, 'JSend.success(res, 200, order, "Orden actualizada");');
  content = content.replace(/res\.status\(201\)\.json\(\{\s*success:\s*true,\s*data:\s*vendor\s*\}\);/g, 'JSend.success(res, 201, vendor, "Restaurante registrado");');
  content = content.replace(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*data:\s*user\s*\}\);/g, 'JSend.success(res, 200, user, "Usuario registrado");');
  content = content.replace(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*data:\s*updatedUser\s*\}\);/g, 'JSend.success(res, 200, updatedUser, "Rol reiniciado");');
  content = content.replace(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*data:\s*updatedProduct\s*\}\);/g, 'JSend.success(res, 200, updatedProduct, "Producto actualizado");');
  content = content.replace(/res\.status\(201\)\.json\(\{\s*success:\s*true,\s*data:\s*product\s*\}\);/g, 'JSend.success(res, 201, product, "Producto creado");');

  // Categories controller uses array
  content = content.replace(/res\.status\(200\)\.json\(categories\.map\(serializeCategory\)\);/g, 'JSend.success(res, 200, categories.map(serializeCategory));');
  
  // Routes
  content = content.replace(/res\.status\(401\)\.json\(\{ error: "([^"]+)" \}\);/g, 'JSend.error(res, 401, "$1");');
  content = content.replace(/res\.status\(400\)\.json\(\{ error: "([^"]+)" \}\);/g, 'JSend.error(res, 400, "$1");');
  content = content.replace(/res\.status\(404\)\.json\(\{ error: `([^`]+)` \}\);/g, 'JSend.error(res, 404, `$1`);');
  content = content.replace(/res\.status\(403\)\.json\(\{ error: "([^"]+)" \}\);/g, 'JSend.error(res, 403, "$1");');
  content = content.replace(/res\.status\(200\)\.json\(responseDto\);/g, 'JSend.success(res, 200, responseDto);');
  
  // protectedTestRoutes
  content = content.replace(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*message:\s*"([^"]+)",\s*user:\s*req\.auth\.user,\s*\}\);/g, 'JSend.success(res, 200, { user: req.auth.user }, "$1");');
  content = content.replace(/res\.status\(500\)\.json\(\{ error: "([^"]+)" \}\);/g, 'JSend.error(res, 500, "$1");');
  content = content.replace(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*message:\s*"([^"]+)",\s*\}\);/g, 'JSend.success(res, 200, null, "$1");');

  // ClerkWebhook
  content = content.replace(/return res\.status\(err\.statusCode \|\| 401\)\.json\(\{\s*success:\s*false,\s*message:\s*err\.message\s*\}\);/g, 'return JSend.error(res, err.statusCode || 401, err.message);');
  content = content.replace(/return res\.status\(err\.statusCode\)\.json\(\{\s*success:\s*false,\s*message:\s*err\.message\s*\}\);/g, 'return JSend.error(res, err.statusCode, err.message);');
  content = content.replace(/return res\.status\(200\)\.json\(\{\s*success:\s*true,\s*message:\s*"([^"]+)"\s*\}\);/g, 'return JSend.success(res, 200, null, "$1");');
  
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
