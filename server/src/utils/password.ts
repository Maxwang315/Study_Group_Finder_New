import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const DEFAULT_SALT_LENGTH = 16;
const DEFAULT_KEY_LENGTH = 64;
const DEFAULT_COST = 12;

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

const getCostFactor = (): number => {
  const raw = process.env.BCRYPT_SALT_ROUNDS;

  if (!raw) {
    return DEFAULT_COST;
  }

  const parsed = Number(raw);

  if (Number.isNaN(parsed) || parsed < 4) {
    throw new Error("BCRYPT_SALT_ROUNDS must be a number greater than or equal to 4");
  }

  return parsed;
};

export const hashPassword = async (password: string): Promise<string> => {
  if (password.length === 0) {
    throw new Error("Password must not be empty");
  }

  const salt = randomBytes(DEFAULT_SALT_LENGTH);
  const cost = getCostFactor();
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
