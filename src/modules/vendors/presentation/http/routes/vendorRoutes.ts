import { Router } from "express";
import { GetVendorsController } from "../controllers/GetVendorsController";
import { RegisterVendorController } from "../controllers/RegisterVendorController";
import { RegisterVendorUseCase } from "../../../application/use-cases/RegisterVendorUseCase";
import { PrismaVendorRepository } from "../../../infrastructure/persistence/PrismaVendorRepository";
import { requireAuth } from "../../../../../shared/middlewares/requireAuth";

export const createVendorModuleRouter = (): Router => {
  const router = Router();

  const vendorRepository = new PrismaVendorRepository();
  const getVendorsController = new GetVendorsController();

  const registerVendorUseCase = new RegisterVendorUseCase(vendorRepository);
  const registerVendorController = new RegisterVendorController(registerVendorUseCase);

  router.get("/", (req, res) => getVendorsController.handle(req, res));
  router.post("/register", requireAuth, (req, res, next) => registerVendorController.handle(req, res, next));

  return router;
};
