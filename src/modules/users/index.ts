import { Router } from "express";
import { buildUserRoutes } from "./presentation/http/routes/userRoutes";

export const createUsersModuleRouter = (): Router => {
  return buildUserRoutes();
};
