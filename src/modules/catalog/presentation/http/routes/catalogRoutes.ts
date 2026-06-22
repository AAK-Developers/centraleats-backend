import { Router } from "express";
import multer from "multer";
import { GetCategoriesController } from "../controllers/GetCategoriesController";
import { GetProductsController } from "../controllers/GetProductsController";
import { CreateProductController } from "../controllers/CreateProductController";
import { CreateProductUseCase } from "../../../application/use-cases/CreateProductUseCase";
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

  router.get("/categories", (req, res) => getCategoriesController.handle(req, res));
  router.get("/products", (req, res) => getProductsController.handle(req, res));
  
  // Create Product route
  router.post("/products", requireAuth, requireRole(["VENDOR"]), upload.single('image'), (req, res, next) => createProductController.handle(req, res, next));

  return router;
};
