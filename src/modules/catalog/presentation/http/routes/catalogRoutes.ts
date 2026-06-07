import { Router } from "express";
import { GetCategoriesController } from "../controllers/GetCategoriesController";
import { GetProductsController } from "../controllers/GetProductsController";

export const createCatalogModuleRouter = (): Router => {
  const router = Router();
  const getCategoriesController = new GetCategoriesController();
  const getProductsController = new GetProductsController();

  router.get("/categories", (req, res) => getCategoriesController.handle(req, res));
  router.get("/products", (req, res) => getProductsController.handle(req, res));

  return router;
};
