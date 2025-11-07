import type { NextFunction, Request, Response } from "express";

import { clearAuthCookie, setAuthCookie } from "../config/auth";
import { ConflictError, UnauthorizedError } from "../errors/httpErrors";
import type { UserDocument } from "../models/user";
import UserModel from "../models/user";
import { signAuthToken } from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";
import { validateLoginBody, validateSignupBody } from "../validators/authValidators";

interface SerializedUser {
  id: string;
  email: string;
  name: string;
  university: string;
  createdAt: Date;
  updatedAt: Date;
}

const serializeUser = (user: UserDocument): SerializedUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  university: user.university,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateSignupBody(req.body);

    const existingUser = await UserModel.findOne({ email: data.email }).exec();

    if (existingUser) {
      throw new ConflictError("Email address is already registered");
    }

    const passwordHash = await hashPassword(data.password);

    const user = await UserModel.create({
      email: data.email,
      name: data.name,
      university: data.university,
      passwordHash,
    });

    const token = signAuthToken({ userId: user.id });
    setAuthCookie(res, token);

    res.status(201).json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateLoginBody(req.body);

    const user = await UserModel.findOne({ email: data.email }).exec();

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValidPassword = await verifyPassword(data.password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = signAuthToken({ userId: user.id });
    setAuthCookie(res, token);

    res.status(200).json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    clearAuthCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const me = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedError();
    }

    res.status(200).json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
};
