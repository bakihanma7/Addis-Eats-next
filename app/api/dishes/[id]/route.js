import { NextResponse } from 'next/server';
import { getDish } from '@/lib/dishes';
import { errorResponse } from '@/lib/api';

// GET /api/dishes/:id -> 200 { dish } or 404 with the standard error shape
export async function GET(_request, { params }) {
  const { id } = await params;
  const dish = getDish(id);
  if (!dish) return errorResponse(404, 'not_found', `No dish with id "${id}".`);
  return NextResponse.json({ dish });
}
