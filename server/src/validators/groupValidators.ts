import { Types } from "mongoose";
import { type SafeParseReturnType, type ZodIssue, z } from "zod";

import { ValidationError } from "../errors/httpErrors";

const trimmedString = (field: string) =>
  z
    .string({ required_error: `${field} is required` })
    .trim()
    .min(1, `${field} must not be empty`);

const optionalTrimmedString = (field: string) =>
  z.preprocess(
    (value: unknown) => {
      if (typeof value !== "string") {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    z.string().optional(),
  );

const optionalObjectId = (field: string) =>
  z.preprocess(
    (value: unknown) => {
      if (typeof value !== "string") {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    z
      .string()
      .refine((val: string) => Types.ObjectId.isValid(val), {
        message: `${field} must be a valid id`,
      })
      .optional(),
  );

const createGroupSchema = z.object({
  name: trimmedString("name"),
  description: optionalTrimmedString("description"),
  university: trimmedString("university"),
});

const groupQuerySchema = z.object({
  search: optionalTrimmedString("search"),
  university: optionalTrimmedString("university"),
  ownerId: optionalObjectId("ownerId"),
  memberId: optionalObjectId("memberId"),
});

export type CreateGroupRequestBody = z.infer<typeof createGroupSchema>;
export type GroupQueryParams = z.infer<typeof groupQuerySchema>;

const parseOrThrow = <T>(result: SafeParseReturnType<unknown, T>): T => {
  if (!result.success) {
    const message = result.error.errors.map((issue: ZodIssue) => issue.message).join(", ");
    throw new ValidationError(message);
  }

  return result.data;
};

export const validateCreateGroupBody = (body: unknown): CreateGroupRequestBody => {
  return parseOrThrow(createGroupSchema.safeParse(body));
};

export const validateGroupQueryParams = (query: unknown): GroupQueryParams => {
  return parseOrThrow(groupQuerySchema.safeParse(query));
};
