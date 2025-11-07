import type { CookieOptions, Response } from "express";

import { config } from "./env";

export const AUTH_COOKIE_NAME = config.auth.cookie.name;

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: config.environment.isProduction ? "none" : "lax",
  secure: config.environment.isProduction,
  path: "/",
};

const cookieMaxAge = config.auth.cookie.maxAgeMs;

export const getAuthCookieOptions = (
  overrides: Partial<CookieOptions> = {},
): CookieOptions => ({
  ...baseCookieOptions,
  maxAge: cookieMaxAge,
  ...overrides,
});

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions({ maxAge: 0 }));
};

export const getJwtSecret = (): string => {
  const { secret } = config.auth.jwt;

  if (config.environment.isProduction && secret === "development-secret-change-me") {
    throw new Error("JWT_SECRET environment variable must be set in production");
  }

  return secret;
};

export const getJwtExpiresIn = (): string => config.auth.jwt.expiresIn;
