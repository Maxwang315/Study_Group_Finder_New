import { createHmac, timingSafeEqual } from "node:crypto";

import { getJwtExpiresIn, getJwtSecret } from "../config/auth";

const base64UrlEncode = (input: Buffer | string): string => {
  const source = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return source
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const base64UrlDecode = (input: string): Buffer => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
};

const parseExpiration = (value: string): number => {
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  const match = value.match(/^(\d+)([smhd])$/i);
  if (!match) {
    throw new Error("Unsupported JWT expiration format");
  }

  const [, amountStr, unit] = match;
  const amount = Number(amountStr);

  switch (unit.toLowerCase()) {
    case "s":
      return amount;
    case "m":
      return amount * 60;
    case "h":
      return amount * 60 * 60;
    case "d":
      return amount * 60 * 60 * 24;
    default:
      throw new Error("Unsupported JWT expiration unit");
  }
};

export interface AuthTokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

interface SignOptions {
  expiresIn?: string | number;
}

export const signAuthToken = (
  payload: AuthTokenPayload,
  options: SignOptions = {},
): string => {
  const header = { alg: "HS256", typ: "JWT" };
  const issuedAt = Math.floor(Date.now() / 1000);

  const expiresInRaw = options.expiresIn ?? getJwtExpiresIn();
  const expiresInSeconds =
    typeof expiresInRaw === "number" ? expiresInRaw : parseExpiration(expiresInRaw);
  const exp = issuedAt + expiresInSeconds;

  const fullPayload: AuthTokenPayload = {
    ...payload,
    iat: issuedAt,
    exp,
  };

  const headerSegment = base64UrlEncode(JSON.stringify(header));
  const payloadSegment = base64UrlEncode(JSON.stringify(fullPayload));
  const signingInput = `${headerSegment}.${payloadSegment}`;

  const signature = createHmac("sha256", getJwtSecret())
    .update(signingInput)
    .digest();

  const signatureSegment = base64UrlEncode(signature);

  return `${signingInput}.${signatureSegment}`;
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  const [headerSegment, payloadSegment, signatureSegment] = token.split(".");

  if (!headerSegment || !payloadSegment || !signatureSegment) {
    throw new Error("Invalid token structure");
  }

  const signingInput = `${headerSegment}.${payloadSegment}`;
  const expectedSignature = createHmac("sha256", getJwtSecret())
    .update(signingInput)
    .digest();

  const providedSignature = base64UrlDecode(signatureSegment);

  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(base64UrlDecode(payloadSegment).toString("utf8")) as AuthTokenPayload;

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token has expired");
  }

  if (typeof payload.userId !== "string") {
    throw new Error("Invalid token payload");
  }

  return payload;
};
