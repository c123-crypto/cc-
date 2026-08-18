export async function GET() {
  return Response.json({ status: 'ok', version: '2.1.0-cloudflare', time: new Date().toISOString() }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
