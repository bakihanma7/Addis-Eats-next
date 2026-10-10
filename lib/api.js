import { NextResponse } from 'next/server';

// The standard error shape for every /api route:
//   { "error": { "code": "not_found", "message": "...", ...extra } }
export function errorResponse(status, code, message, extra = {}) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status });
}
