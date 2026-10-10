// Validates the `next` (return-to) parameter used by sign-in.
// Dependency-free so middleware, server code and the tests can all import it.
//
// Only a same-site path is allowed. A value must start with a single "/".
// These are rejected, because browsers can read them as another host:
//   "https://evil.com"   not a path (does not start with "/")
//   "//evil.com"         protocol-relative URL
//   "/\evil.com"         browsers treat "\" like "/", so this is "//evil.com"
//   "/\t/evil.com"       browsers strip tabs/newlines, leaving "//evil.com"
export const DEFAULT_NEXT = '/';

export function safeNext(value, fallback = DEFAULT_NEXT) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 500) return fallback;
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//')) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return fallback;
  // Don't bounce a signed-in user straight back to the sign-in page.
  if (value === '/signin' || value.startsWith('/signin?') || value.startsWith('/signin/')) return fallback;
  return value;
}
