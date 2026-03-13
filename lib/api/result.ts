import type { z } from 'zod';

export type FieldErrors = Record<string, string[]>;

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

export function err(code: ApiErrorCode, message: string, fieldErrors?: FieldErrors): ApiResult<never> {
  return { ok: false, error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } };
}

export function zodFieldErrors(e: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of e.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

