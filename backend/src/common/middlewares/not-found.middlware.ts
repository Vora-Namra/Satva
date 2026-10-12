import { Request, Response } from "express";

export function notFoundMiddleware(
  req: Request,
  res: Response
): Response {

  return res.status(404).json({
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`,
    data: null
  });

}