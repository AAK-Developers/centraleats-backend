import { Request, Response, NextFunction } from "express";
import { ClerkWebhookVerifier } from "../../../../../infrastructure/external-services/clerk/ClerkWebhookVerifier";
import { SyncUserUseCase } from "../../../application/use-cases/SyncUserUseCase";
import { UserSyncDTO } from "../../../application/dto/UserSyncDTO";
import { PrismaUserRepository } from "../../../infrastructure/persistence/PrismaUserRepository";

const verifier = new ClerkWebhookVerifier();
const userRepository = new PrismaUserRepository();
const syncUserUseCase = new SyncUserUseCase(userRepository);

export class ClerkWebhookController {
  async handle(req: Request, res: Response, next: NextFunction) {
    try {
      // req.body must be a Buffer from express.raw()
      const payload = req.body;
      
      let evt: any;
      try {
         evt = verifier.verify(payload, req.headers);
      } catch (err: any) {
         console.error("[Webhook Error] Verification failed:", err.message);
         return res.status(err.statusCode || 401).json({ success: false, message: err.message });
      }

      const eventType = evt.type;
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      let mappedEventType: 'created' | 'updated' | 'deleted';
      if (eventType === 'user.created') mappedEventType = 'created';
      else if (eventType === 'user.updated') mappedEventType = 'updated';
      else if (eventType === 'user.deleted') mappedEventType = 'deleted';
      else {
        // Clerk requires 200 OK for ignored events
        return res.status(200).json({ success: true, message: "Ignored event type" });
      }

      const primaryEmail = email_addresses && email_addresses.length > 0 ? email_addresses[0].email_address : undefined;

      const dto: UserSyncDTO = {
        eventType: mappedEventType,
        externalId: id,
        email: primaryEmail,
        fullName: `${first_name || ''} ${last_name || ''}`.trim() || undefined,
        avatarUrl: image_url,
      };

      try {
        await syncUserUseCase.execute(dto);
        return res.status(200).json({ success: true, message: "Webhook processed" });
      } catch (err: any) {
        console.error("[Webhook Error] Processing failed:", err.message);
        if (err.statusCode) {
          return res.status(err.statusCode).json({ success: false, message: err.message });
        }
        throw err; // Global error handler catches 500s
      }
      
    } catch (error) {
      next(error);
    }
  }
}
