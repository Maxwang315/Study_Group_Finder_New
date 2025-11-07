import type { NextFunction, Request, Response } from "express";

import statsService from "../services/statsService";

export const statsMiddleware = async (
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    await statsService.incrementVisitCount();
  } catch (error) {
    console.error("Failed to record visit count", error);
  }

  next();
};
