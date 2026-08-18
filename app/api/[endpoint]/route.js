import { handleApiRequest } from '../../../lib/api.js';

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Ark-Key, X-OpenAI-Key, X-Request-Id',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request, context) {
  const params = await context.params;
  return handleApiRequest(request, params.endpoint);
}
