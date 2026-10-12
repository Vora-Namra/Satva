import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload, sign, verifyRefreshToken } from "../../modules/auth/utils/jwt.js";
import logger from "../logger.js";
import { UserRepository } from "../../modules/auth/auth.repository.js";

export interface AuthRequest extends Request {
  user: JwtPayload;
}

//  Verify JWT & attaching user 
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {

  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({
      statusCode: 401,
      message: "Missing or invalid authorization header",
      data: null
    });
    return;
  }

  const accessToken = header.split(" ")[1];

  if (!accessToken || accessToken === "null" || accessToken === "undefined") {
    res.status(401).json({
      statusCode: 401,
      message: "Missing or invalid authorization token",
      data: null
    });
    return;
  }

  try {

    // Access token valid
    const payload = verifyToken(accessToken);
    (req as AuthRequest).user = payload;

    return next();

  } catch (error: any) {

    // Token is invalid but NOT expired
    if (error.name !== "TokenExpiredError") {
      res.status(401).json({
        statusCode: 401,
        message: "Invalid token",
        data: null
      });
      return;
    }

    // Access token expired
    const refreshToken = req.cookies.refreshToken;

    // console.log(req.cookies.refreshToken)
    if (!refreshToken) {
      res.status(401).json({
        statusCode: 401,
        message: "Refresh token missing",
        data: null
      });
      return;
    }

    try {

      // Verify refresh token

      let userRepository = new UserRepository();
      const refreshPayload: any =
        verifyRefreshToken(refreshToken);

      // Check refresh token exists in database
      const session =
        await userRepository.findSessionByRefreshToken(
          refreshToken
        );

      if (!session) {
        res.status(401).json({
          statusCode: 401,
          message: "Session expired",
          data: null
        });
        return;
      }

      // Generate new access token
      const newAccessToken = sign({
        id: refreshPayload.id,
        email: refreshPayload.email,
        role: refreshPayload.role
      });

      console.log("new Access Token is Created")
      // Send new token back to frontend
      res.setHeader(
        "x-access-token",
        newAccessToken
      );

      // Continue request with refresh token payload
      (req as AuthRequest).user = refreshPayload;

      return next();

    } catch {

      res.status(401).json({
        statusCode: 401,
        message: "Invalid refresh token",
        data: null
      });

      return;
    }
  }
}  


// Role-based auth
export function isPatient(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthRequest).user;
  if (user?.role !== "PATIENT") {
    res.status(403).json({ statusCode: 403, message: "Access restricted to patients", data: null });
    return;
  }
  next();
}

export function isDoctor(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthRequest).user;
  if (user?.role !== "DOCTOR") {
    res.status(403).json({ statusCode: 403, message: "Access restricted to doctors", data: null });
    return;
  }
  next();
}

export function isAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthRequest).user;

  if (user?.role !== "ADMIN") {
    res.status(403).json({ statusCode: 403, message: "Access restricted to admins", data: null });
    return;
  }
  next();
}

export function isStaff(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthRequest).user;

  if (user?.role !== "STAFF") {
    res.status(403).json({ statusCode: 403, message: "Access restricted to STAFFS", data: null });
    return;
  }
  next();
}

export function isSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthRequest).user;

  if (user?.role !== "SUPER_ADMIN") {
    res.status(403).json({ statusCode: 403, message: "Access restricted to SUPER ADMINS", data: null });
    return;
  }
  next();
}


//  authenticate + role  
export const patientAuth = [authenticate, isPatient];
export const doctorAuth = [authenticate, isDoctor];
export const adminAuth = [authenticate, isAdmin];
export const staffAuth = [authenticate, isStaff];
export const superAdminAuth = [authenticate, isSuperAdmin]

export function authorizeRoles(...roles: Array<"PATIENT" | "DOCTOR" | "ADMIN" | "STAFF" | "SUPER_ADMIN">) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;
    if (!roles.includes(user?.role)) {
      res.status(403).json({ statusCode: 403, message: `Access restricted to: ${roles.join(", ")}`, data: null });
      return;
    }
    next();
  };
}
