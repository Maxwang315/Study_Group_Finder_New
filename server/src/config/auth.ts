import type { CookieOptions, Response } from "express";

const DEFAULT_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const isProduction = process.env.NODE_ENV === "production";

const resolveCookieMaxAge = (): number => {
  const raw = process.env.AUTH_COOKIE_MAX_AGE_MS;

  if (!raw) {
    return DEFAULT_COOKIE_MAX_AGE_MS;
  }

  const parsed = Number(raw);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error("AUTH_COOKIE_MAX_AGE_MS must be a positive number when provided");
  }

  return parsed;
};

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "sgf_session";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  path: "/",
};

const cookieMaxAge = resolveCookieMaxAge();

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
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable must be defined");
  }

  return secret;
};

const DEFAULT_JWT_EXPIRES_IN = "7d";

export const getJwtExpiresIn = (): string =>
  process.env.JWT_EXPIRES_IN ?? DEFAULT_JWT_EXPIRES_IN;
