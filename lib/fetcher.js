// The one fetcher used by every SWR query in the app.
// It turns non-2xx responses into thrown errors (SWR only treats a thrown
// error as a failure) and keeps the HTTP status on the error so callers can
// decide what to do, e.g. not retry a 404.
export class FetchError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
  }
}

export async function fetcher(url) {
  const res = await fetch(url);
  if (!res.ok) {
    // Our API errors look like { error: { code, message } }.
    const body = await res.json().catch(() => null);
    throw new FetchError(res.status, body?.error?.message ?? res.statusText);
  }
  return res.json();
}
