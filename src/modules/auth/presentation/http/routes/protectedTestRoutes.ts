import { JSend } from "../../../../../shared/utils/JSend";
import { Router, Request, Response } from "express";
import { requireRole } from "../../../../../shared/middlewares/requireRole";
import { AuthMeResponseDTO } from "../../../application/dto/AuthMeResponseDTO";

const router = Router();

// Ruta de prueba existente (solo requireAuth)
router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Authentication successful (No RBAC)",
    auth: req.auth,
  });
});

// Ruta de prueba protegida por rol (STUDENT o ADMIN)
router.get("/student", requireRole(["STUDENT", "ADMIN"]), (req: Request, res: Response) => {
  const user = req.auth?.user;
  
  if (!user) {
    JSend.error(res, 500, "Context not enriched");
    return;
  }

  // Ejemplo de cómo /auth/me usará el DTO en el futuro
  const responseDto = new AuthMeResponseDTO(user);

  res.status(200).json({
    success: true,
    message: "Student access granted",
    me: responseDto,
  });
});

// Ruta de prueba protegida por rol (VENDOR o ADMIN)
router.get("/vendor", requireRole(["VENDOR", "ADMIN"]), (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Vendor access granted",
    userRole: req.auth?.user?.role,
  });
});

export default router;
