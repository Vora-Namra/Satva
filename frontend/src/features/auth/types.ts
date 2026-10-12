import type { Role } from "../../constants/roles";

export type AuthUser = {
  user_id?: number;
  id?: number;
  email: string;
  role: Role;
  first_name?: string;
  last_name?: string;
};

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};
