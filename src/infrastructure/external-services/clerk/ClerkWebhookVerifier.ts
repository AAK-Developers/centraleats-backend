import { Webhook } from "svix";
import { env } from "../../../config/env";
import { AppError } from "../../../shared/errors/AppError";

export class ClerkWebhookVerifier {
  verify(payload: string | Buffer, headers: Record<string, string | string[] | undefined>): any {
    const svix_id = headers["svix-id"] as string;
    const svix_timestamp = headers["svix-timestamp"] as string;
    const svix_signature = headers["svix-signature"] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      throw new AppError("Missing svix headers", 400);
    }

    const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
    const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);

    try {
      return wh.verify(payloadString, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err: any) {
      throw new AppError("Invalid webhook signature", 401);
    }
  }
}
