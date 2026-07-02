import { Router } from "express";
import multer from "multer";
import { GetCategoriesController } from "../controllers/GetCategoriesController";
import { GetProductsController } from "../controllers/GetProductsController";
import { CreateProductController } from "../controllers/CreateProductController";
import { UpdateProductController } from "../controllers/UpdateProductController";
import { DeleteProductController } from "../controllers/DeleteProductController";
import { CreateProductUseCase } from "../../../application/use-cases/CreateProductUseCase";
import { UpdateProductUseCase } from "../../../application/use-cases/UpdateProductUseCase";
import { DeleteProductUseCase } from "../../../application/use-cases/DeleteProductUseCase";
import { PrismaProductRepository } from "../../../infrastructure/persistence/PrismaProductRepository";
import { PrismaVendorRepository } from "../../../../vendors/infrastructure/persistence/PrismaVendorRepository";
import { SupabaseStorageAdapter } from "../../../../../shared/infrastructure/storage/supabase-storage.adapter";
import { requireAuth } from "../../../../../shared/middlewares/requireAuth";
import { requireRole } from "../../../../../shared/middlewares/requireRole";

export const createCatalogModuleRouter = (): Router => {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage() });

  const productRepository = new PrismaProductRepository();
  const vendorRepository = new PrismaVendorRepository();
  const storageAdapter = new SupabaseStorageAdapter();

  const getCategoriesController = new GetCategoriesController();
  const getProductsController = new GetProductsController();
  
  const createProductUseCase = new CreateProductUseCase(productRepository, vendorRepository, storageAdapter);
  const createProductController = new CreateProductController(createProductUseCase);

  const updateProductUseCase = new UpdateProductUseCase(productRepository, vendorRepository, storageAdapter);
  const updateProductController = new UpdateProductController(updateProductUseCase);

  const deleteProductUseCase = new DeleteProductUseCase(productRepository, vendorRepository);
  const deleteProductController = new DeleteProductController(deleteProductUseCase);

  router.get("/categories", (req, res) => getCategoriesController.handle(req, res));
  router.get("/products", requireAuth, (req, res) => getProductsController.handle(req, res));
  
  // Create Product route
  router.post("/products", requireAuth, requireRole(["VENDOR"]), upload.single('image'), (req, res, next) => createProductController.handle(req, res, next));

  // Edit Product route
  router.put("/products/:id", requireAuth, requireRole(["VENDOR"]), upload.single('image'), (req, res, next) => updateProductController.handle(req, res, next));

  // Delete Product route
  router.delete("/products/:id", requireAuth, requireRole(["VENDOR"]), (req, res, next) => deleteProductController.handle(req, res, next));

  return router;
};
