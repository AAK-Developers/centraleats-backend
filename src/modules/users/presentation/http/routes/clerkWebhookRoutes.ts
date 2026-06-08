import { Router } from "express";
import { ClerkWebhookController } from "../controllers/ClerkWebhookController";

const router = Router();
const controller = new ClerkWebhookController();

router.post("/", (req, res, next) => controller.handle(req, res, next));

export default router;
