import type { NextFunction, Request, Response } from "express";

import { clearAuthCookie, AUTH_COOKIE_NAME } from "../config/auth";
import { UnauthorizedError } from "../errors/httpErrors";
import UserModel from "../models/user";
import { verifyAuthToken } from "../utils/jwt";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token || typeof token !== "string") {
      throw new UnauthorizedError();
    }

    const payload = verifyAuthToken(token);

    const user = await UserModel.findById(payload.userId).exec();

    if (!user) {
      clearAuthCookie(res);
      throw new UnauthorizedError();
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }

    clearAuthCookie(res);
    next(new UnauthorizedError());
  }
};
