import { NextResponse } from 'next/server';
import type { ZodType } from 'zod';
import { err, ok, zodFieldErrors, type ApiResult } from '@/lib/api/result';

export function jsonResult<T>(result: ApiResult<T>, init?: ResponseInit) {
  return NextResponse.json(result, init);
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return jsonResult(ok(data), init);
}

export function jsonErr(
  code: Parameters<typeof err>[0],
  message: string,
  init?: ResponseInit & { fieldErrors?: Parameters<typeof err>[2] }
) {
  const status = init?.status ?? 400;
  return NextResponse.json(err(code, message, init?.fieldErrors), { status });
}

export async function parseJson<T>(request: Request, schema: ZodType<T>) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false as const, result: err('VALIDATION_ERROR', 'Invalid JSON body') };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      result: err('VALIDATION_ERROR', 'Validation error', zodFieldErrors(parsed.error)),
    };
  }

  return { ok: true as const, data: parsed.data };
}

