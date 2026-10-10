// The one zod schema for an order. The checkout form (via the server action)
// and POST /api/orders both validate against this exact object, so the two
// entry points can never disagree about what a valid order is.
import { z } from 'zod';

export const MAX_QTY = 20;

export const orderItemSchema = z.object({
  id: z.string().min(1).max(50),
  qty: z.coerce.number().int('Quantity must be a whole number').min(1, 'Quantity must be at least 1').max(MAX_QTY, `Maximum ${MAX_QTY} of any one dish`),
});

export const orderSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80, 'Name is too long'),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number'),
  address: z.string().trim().min(5, 'Enter a delivery address').max(200, 'Address is too long'),
  notes: z.string().trim().max(300, 'Notes are too long').default(''),
  items: z.array(orderItemSchema).min(1, 'Your cart is empty').max(30, 'Too many items'),
});

// Query string for GET /api/dishes.
export const dishQuerySchema = z.object({
  q: z.string().trim().max(80, 'Search is too long').default(''),
  page: z.coerce.number().int('Page must be a whole number').min(1, 'Page starts at 1').default(1),
  pageSize: z.coerce.number().int('Page size must be a whole number').min(1, 'Page size starts at 1').max(20, 'Page size is at most 20').default(20),
});
