import { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Centralized error handler for consistent responses
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  const status = err instanceof HttpError ? err.status : 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
};
