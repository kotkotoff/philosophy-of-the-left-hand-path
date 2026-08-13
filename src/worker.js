const SITE_ORIGIN = 'https://philosophy-of-the-left-hand-path.org';
const SITE_ORIGIN_TOKEN = '{{SITE_ORIGIN}}';
const SEO_CONTENT_TYPES = ['text/html', 'application/xml', 'text/xml', 'text/plain'];

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    if (response.status !== 200 || request.method !== 'GET') {
      return response;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!SEO_CONTENT_TYPES.some((type) => contentType.includes(type))) {
      return response;
    }

    const body = await response.text();
    if (!body.includes(SITE_ORIGIN_TOKEN)) {
      return response;
    }

    const headers = new Headers(response.headers);
    headers.delete('content-encoding');
    headers.delete('content-length');
    headers.delete('etag');

    return new Response(body.replaceAll(SITE_ORIGIN_TOKEN, SITE_ORIGIN), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
