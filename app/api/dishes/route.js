import { NextResponse } from 'next/server';
import { searchDishes } from '@/lib/dishes';
import { errorResponse } from '@/lib/api';
import { dishQuerySchema } from '@/lib/schema';

// GET /api/dishes?q=&page=&pageSize=
//   200 { dishes, page, pageSize, total, totalPages }
//   422 validation_failed with fieldErrors for a bad page / pageSize / q
// With no query string it returns every dish (pageSize defaults to 20).
export async function GET(request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = dishQuerySchema.safeParse(params);
  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    return errorResponse(422, 'validation_failed', 'Invalid query parameters.', { fieldErrors, formErrors });
  }
  return NextResponse.json(searchDishes(parsed.data));
}
