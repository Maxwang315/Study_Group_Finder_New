import { Types } from "mongoose";

import { ValidationError } from "../errors/httpErrors";

const ensureObject = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null) {
    throw new ValidationError("Request body must be an object");
  }

  return value as Record<string, unknown>;
};

const readRequiredString = (body: Record<string, unknown>, field: string): string => {
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

const readOptionalString = (body: Record<string, unknown>, field: string): string | undefined => {
  const value = body[field];

  if (typeof value === "undefined") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be a string`);
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed;
};

const ensureQueryObject = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return value as Record<string, unknown>;
};

const readQueryString = (query: Record<string, unknown>, field: string): string | undefined => {
  const value = query[field];

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return undefined;
};

const validateObjectId = (value: string, field: string): string => {
  if (!Types.ObjectId.isValid(value)) {
    throw new ValidationError(`${field} must be a valid id`);
  }

  return value;
};

export interface CreateGroupRequestBody {
  name: string;
  description?: string;
  university: string;
}

export const validateCreateGroupBody = (body: unknown): CreateGroupRequestBody => {
  const parsed = ensureObject(body);

  const name = readRequiredString(parsed, "name");
  const university = readRequiredString(parsed, "university");
  const description = readOptionalString(parsed, "description");

  return { name, university, description };
};

export interface GroupQueryParams {
  search?: string;
  university?: string;
  ownerId?: string;
  memberId?: string;
}

export const validateGroupQueryParams = (query: unknown): GroupQueryParams => {
  const parsed = ensureQueryObject(query);

  const result: GroupQueryParams = {};

  const search = readQueryString(parsed, "search");
  if (search) {
    result.search = search;
  }

  const university = readQueryString(parsed, "university");
  if (university) {
    result.university = university;
  }

  const ownerId = readQueryString(parsed, "ownerId");
  if (ownerId) {
    result.ownerId = validateObjectId(ownerId, "ownerId");
  }

  const memberId = readQueryString(parsed, "memberId");
  if (memberId) {
    result.memberId = validateObjectId(memberId, "memberId");
  }

  return result;
};
