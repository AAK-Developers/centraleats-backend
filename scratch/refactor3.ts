import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/modules/vendors/presentation/http/controllers/RegisterVendorController.ts',
  'src/modules/users/presentation/http/controllers/ResetUserRoleController.ts',
  'src/modules/users/presentation/http/controllers/RegisterUserController.ts',
  'src/modules/orders/presentation/http/controllers/UpdateOrderStatusController.ts',
  'src/modules/orders/presentation/http/controllers/CreateOrderController.ts',
  'src/modules/catalog/presentation/http/controllers/CreateProductController.ts',
  'src/modules/catalog/presentation/http/controllers/UpdateProductController.ts',
  'src/modules/auth/presentation/http/routes/protectedTestRoutes.ts'
];

for (const relPath of filesToUpdate) {
  const file = path.join(__dirname, '..', relPath);
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  content = content.replace(/res\.status\(201\)\.json\(\{\s*success:\s*true,\s*data:\s*vendor,\s*\}\);/g, 'JSend.success(res, 201, vendor, "Restaurante registrado");');
  content = content.replace(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*data:\s*updatedUser,\s*\}\);/g, 'JSend.success(res, 200, updatedUser, "Rol reiniciado");');
  content = content.replace(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*data:\s*user,\s*\}\);/g, 'JSend.success(res, 200, user, "Usuario registrado");');
  content = content.replace(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*data:\s*order,\s*\}\);/g, 'JSend.success(res, 200, order, "Estado actualizado");');
  content = content.replace(/res\.status\(201\)\.json\(\{\s*success:\s*true,\s*data:\s*order,\s*\}\);/g, 'JSend.success(res, 201, order, "Orden creada");');
  content = content.replace(/res\.status\(201\)\.json\(\{\s*success:\s*true,\s*data:\s*product,\s*\}\);/g, 'JSend.success(res, 201, product, "Producto creado");');
  content = content.replace(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*data:\s*updatedProduct,\s*\}\);/g, 'JSend.success(res, 200, updatedProduct, "Producto actualizado");');

  content = content.replace(/res\.status\(200\)\.json\(\{\s*success:\s*true,\s*message:\s*"([^"]+)",\s*\}\);/g, 'JSend.success(res, 200, null, "$1");');
  
  if (content.includes('JSend.') && !content.includes('JSend"')) {
    const depth = (file.match(/\\/g) || []).length - (path.join(__dirname, '../src/modules').match(/\\/g) || []).length;
    const prefix = Array(depth + 1).fill('..').join('/');
    content = `import { JSend } from "${prefix}/shared/utils/JSend";\n` + content;
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
