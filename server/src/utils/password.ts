import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

import { config } from "../config/env";

const DEFAULT_SALT_LENGTH = 16;
const DEFAULT_KEY_LENGTH = 64;

const scryptAsync = (password: string, salt: Buffer, keyLength: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });

export const hashPassword = async (password: string): Promise<string> => {
  if (password.length === 0) {
    throw new Error("Password must not be empty");
  }

  const salt = randomBytes(DEFAULT_SALT_LENGTH);
  const cost = config.security.bcryptSaltRounds;
  const derivedKey = await scryptAsync(password, salt, DEFAULT_KEY_LENGTH);

  return [cost.toString(10), salt.toString("hex"), derivedKey.toString("hex")].join(":");
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const [costPart, saltPart, keyPart] = hash.split(":");

  if (!costPart || !saltPart || !keyPart) {
    return false;
  }

  const salt = Buffer.from(saltPart, "hex");
  const storedKey = Buffer.from(keyPart, "hex");

  const derivedKey = await scryptAsync(password, salt, storedKey.length);

  return timingSafeEqual(storedKey, derivedKey);
};
