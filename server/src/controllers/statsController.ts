import type { Request, Response } from "express";

import statsService from "../services/statsService";

export const getStats = async (_req: Request, res: Response) => {
  const stats = await statsService.getStats();

  res.status(200).json(stats);
};
