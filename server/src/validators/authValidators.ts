import { type SafeParseReturnType, type ZodIssue, z } from "zod";

import { ValidationError } from "../errors/httpErrors";

const trimAndRequire = (field: string) =>
  z
    .string({ required_error: `${field} is required` })
    .trim()
    .min(1, `${field} must not be empty`);

const emailSchema = trimAndRequire("email")
  .email("Email address is invalid")
  .transform((value: string) => value.toLowerCase());

const passwordSchema = trimAndRequire("password").min(
  8,
  "Password must be at least 8 characters long",
);

const signupSchema = z.object({
  email: emailSchema,
  name: trimAndRequire("name"),
  university: trimAndRequire("university"),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: trimAndRequire("password"),
});

export type SignupRequestBody = z.infer<typeof signupSchema>;
export type LoginRequestBody = z.infer<typeof loginSchema>;

const handleParseResult = <T>(result: SafeParseReturnType<unknown, T>): T => {
  if (!result.success) {
    const message = result.error.errors.map((issue: ZodIssue) => issue.message).join(", ");
    throw new ValidationError(message);
  }

  return result.data;
};

export const validateSignupBody = (body: unknown): SignupRequestBody => {
  return handleParseResult(signupSchema.safeParse(body));
};

export const validateLoginBody = (body: unknown): LoginRequestBody => {
  return handleParseResult(loginSchema.safeParse(body));
};
