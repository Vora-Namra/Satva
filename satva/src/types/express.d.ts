import "express-session"
import type { Request  } from "express";
import type { User } from "../common/interfaces/app.interfaces.ts";

declare global{
  namespace Express{
    interface Request{
      authUser?:AuthUser
    }
  }
}

declare module "express-session"{
  interface Session{
    captcha?:string,
    isOtpVerified?:boolean,
    isEmailVerified?:boolean,
    email?:string,
    user_id?:number,
  }
} 
export interface AuthUser {
    user_id: number;          // Unique ID for database queries
    username: string;        // Display name or mentions
    email: string;           // Optional: useful for notifications/auth
    role?: 'user' | 'admin'; // Optional: for permission checks
    iat?: number;            // Optional: Issued At (from JWT)
    exp?: number;            // Optional: Expiration (from JWT)
}
