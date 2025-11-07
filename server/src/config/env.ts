import path from "path";

import dotenv from "dotenv";

dotenv.config();

type NodeEnvironment = "development" | "production" | "test";

const normalizeNodeEnv = (value: string | undefined): NodeEnvironment => {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
};

const parseInteger = (value: string | undefined, fallback: number, options?: { min?: number }): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || (options?.min !== undefined && parsed < options.min)) {
    return fallback;
  }

  return parsed;
};

const parsePositiveInteger = (value: string | undefined, fallback: number): number =>
  parseInteger(value, fallback, { min: 1 });

const parseClientOrigins = (value: string | undefined, nodeEnv: NodeEnvironment): string[] => {
  if (!value) {
    return nodeEnv === "production" ? [] : ["http://localhost:3000"];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

const parseTrustProxy = (value: string | undefined, isProduction: boolean): boolean | number | string => {
  if (value === undefined) {
    return isProduction;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  const numeric = Number(value);

  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  return value;
};

const nodeEnv = normalizeNodeEnv(process.env.NODE_ENV);
const isProduction = nodeEnv === "production";
const isTest = nodeEnv === "test";

const port = parsePositiveInteger(process.env.PORT, 3001);
const clientOrigins = parseClientOrigins(process.env.CLIENT_ORIGINS, nodeEnv);
const mongodbUri = process.env.MONGODB_URI && process.env.MONGODB_URI.length > 0
  ? process.env.MONGODB_URI
  : "mongodb://localhost:27017/study-group-finder";
const redisUrl = process.env.REDIS_URL;
const bcryptSaltRounds = parseInteger(process.env.BCRYPT_SALT_ROUNDS, 12, { min: 4 });
const authCookieMaxAgeMs = parsePositiveInteger(process.env.AUTH_COOKIE_MAX_AGE_MS, 7 * 24 * 60 * 60 * 1000);
const authCookieName = process.env.AUTH_COOKIE_NAME && process.env.AUTH_COOKIE_NAME.length > 0
  ? process.env.AUTH_COOKIE_NAME
  : "sgf_session";
const jwtSecret = process.env.JWT_SECRET && process.env.JWT_SECRET.length > 0
  ? process.env.JWT_SECRET
  : "development-secret-change-me";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN && process.env.JWT_EXPIRES_IN.length > 0
  ? process.env.JWT_EXPIRES_IN
  : "7d";
const rateLimitWindowMinutes = parsePositiveInteger(process.env.RATE_LIMIT_WINDOW_MINUTES, 15);
const rateLimitMax = parsePositiveInteger(process.env.RATE_LIMIT_MAX, 100);
const trustProxy = parseTrustProxy(process.env.TRUST_PROXY, isProduction);
const staticAssetsPath = process.env.STATIC_ASSETS_PATH && process.env.STATIC_ASSETS_PATH.length > 0
  ? path.resolve(process.env.STATIC_ASSETS_PATH)
  : path.resolve(process.cwd(), "client");

export const config = {
  environment: {
    nodeEnv,
    isProduction,
    isTest,
  },
  server: {
    port,
    clientOrigins,
    trustProxy,
    staticAssetsPath,
    rateLimit: {
      windowMinutes: rateLimitWindowMinutes,
      max: rateLimitMax,
    },
  },
  database: {
    uri: mongodbUri,
  },
  cache: {
    redisUrl,
  },
  security: {
    bcryptSaltRounds,
  },
  auth: {
    cookie: {
      name: authCookieName,
      maxAgeMs: authCookieMaxAgeMs,
    },
    jwt: {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn,
    },
  },
};

export type RuntimeConfig = typeof config;
