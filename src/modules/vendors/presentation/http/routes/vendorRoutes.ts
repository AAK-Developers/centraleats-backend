import { Router } from "express";
import multer from "multer";
import { GetVendorsController } from "../controllers/GetVendorsController";
import { RegisterVendorController } from "../controllers/RegisterVendorController";
import { RegisterVendorUseCase } from "../../../application/use-cases/RegisterVendorUseCase";
import { PrismaVendorRepository } from "../../../infrastructure/persistence/PrismaVendorRepository";
import { SupabaseStorageAdapter } from "../../../../../shared/infrastructure/storage/supabase-storage.adapter";
import { requireAuth } from "../../../../../shared/middlewares/requireAuth";
import { requireRole } from "../../../../../shared/middlewares/requireRole";

export const createVendorModuleRouter = (): Router => {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage() });

  const vendorRepository = new PrismaVendorRepository();
  const storageAdapter = new SupabaseStorageAdapter();
  const getVendorsController = new GetVendorsController();

  const registerVendorUseCase = new RegisterVendorUseCase(vendorRepository, storageAdapter);
  const registerVendorController = new RegisterVendorController(registerVendorUseCase);

  router.get("/", (req, res) => getVendorsController.handle(req, res));
  // Middleware chain: requireAuth → requireRole(VENDOR) → multer (parses multipart body) → Controller (Zod validates req.body)
  router.post("/register", requireAuth, requireRole(["VENDOR"]), upload.single('image'), (req, res, next) => registerVendorController.handle(req, res, next));

  return router;
};
