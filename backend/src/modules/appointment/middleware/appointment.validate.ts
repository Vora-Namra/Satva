import { ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate_body =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten() });
    }
    req.body = result.data; // parsed/coerced data
    next();
  };

export const validate_query =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten() });
    }
    (req as any).validatedQuery = result.data;
    next();
  };
