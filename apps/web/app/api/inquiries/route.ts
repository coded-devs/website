import { getApiBaseUrl } from '../../../src/lib/articles-api';

/**
 * Same-origin proxy for the contact form. Forwards the JSON body to the API's
 * public inquiry endpoint and passes the status, body and Retry-After back.
 * The API owns validation, rate limiting and storage.
 */
export async function POST(request: Request): Promise<Response> {
  let body: string;
  try {
    body = JSON.stringify(await request.json());
  } catch {
    return Response.json(
      { error: 'Invalid inquiry request', code: 'INQUIRY_INVALID_REQUEST' },
      { status: 400 },
    );
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  try {
    const response = await fetch(
      new URL('/api/v1/public/inquiries', getApiBaseUrl()),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {}),
        },
        body,
        cache: 'no-store',
      },
    );
    const headers = new Headers({ 'Cache-Control': 'no-store' });
    const retryAfter = response.headers.get('retry-after');
    if (retryAfter) headers.set('Retry-After', retryAfter);
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        ...Object.fromEntries(headers),
        'Content-Type': 'application/json',
      },
    });
  } catch {
    return Response.json(
      { error: 'Service unavailable', code: 'INQUIRY_UNAVAILABLE' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
