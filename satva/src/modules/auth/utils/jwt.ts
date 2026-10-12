import jwt from "jsonwebtoken";
import { env } from "../../../config/index.js";

export interface JwtPayload {
  id: number;
  email: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN" | "STAFF" | "SUPER_ADMIN";
}

export function sign(payload: JwtPayload): string {
  const token = jwt.sign(payload, env.JWT_SECRET_KEY as string, {
    expiresIn: "1h",
  });
  return token;
}

export function verifyToken(token: string): JwtPayload {
  const isValid = jwt.verify(token, env.JWT_SECRET_KEY as string);
  return isValid as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const isValid = jwt.verify(
    token,
    env.REFRESH_TOKEN_SECRET as string
  );
  return isValid as JwtPayload;
}

export function signRefreshToken(payload: JwtPayload): string {

  console.log(env.REFRESH_TOKEN_SECRET)
  return jwt.sign(
    payload,
    env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: "15d"
    }
  );

}