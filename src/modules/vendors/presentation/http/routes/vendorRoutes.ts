import { Router } from "express";
import { GetVendorsController } from "../controllers/GetVendorsController";

export const createVendorModuleRouter = (): Router => {
  const router = Router();
  const getVendorsController = new GetVendorsController();

  router.get("/", (req, res) => getVendorsController.handle(req, res));

  return router;
};
