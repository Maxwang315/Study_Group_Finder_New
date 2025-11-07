import type { NextFunction, Request, Response } from "express";

import { HttpError } from "../errors/httpErrors";
import { config } from "../config/env";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof HttpError) {
    if (!config.environment.isTest) {
      console.warn(`${error.constructor.name}: ${error.message}`);
    }
    res.status(error.status).json({ message: error.message });
    return;
  }

  console.error("Unexpected error", error);
  res.status(500).json({ message: "Internal server error" });
};
