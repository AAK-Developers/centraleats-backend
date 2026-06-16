import { User } from "../../modules/users/domain/entities/User";

export interface AuthContext {
  userId: string;
  user?: User;
}
