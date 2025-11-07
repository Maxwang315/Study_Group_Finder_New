import { ValidationError } from "../errors/httpErrors";

export interface SignupRequestBody {
  email: string;
  name: string;
  university: string;
  password: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ensureObject = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null) {
    throw new ValidationError("Request body must be an object");
  }

  return value as Record<string, unknown>;
};

const readStringField = (body: Record<string, unknown>, field: string): string => {
  const value = body[field];

  if (typeof value !== "string") {
    throw new ValidationError(`${field} is required`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    throw new ValidationError(`${field} must not be empty`);
  }

  return trimmed;
};

export const validateSignupBody = (body: unknown): SignupRequestBody => {
  const parsed = ensureObject(body);

  const email = readStringField(parsed, "email").toLowerCase();
  const name = readStringField(parsed, "name");
  const university = readStringField(parsed, "university");
  const password = readStringField(parsed, "password");

  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError("Email address is invalid");
  }

  if (password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long");
  }

  return { email, name, university, password };
};

export const validateLoginBody = (body: unknown): LoginRequestBody => {
  const parsed = ensureObject(body);

  const email = readStringField(parsed, "email").toLowerCase();
  const password = readStringField(parsed, "password");

  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError("Email address is invalid");
  }

  return { email, password };
};
