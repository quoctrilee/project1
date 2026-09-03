export interface Env {}
const CORS_HEADERS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
const categories = ['Hardware', 'Projector', 'AC', 'Electrical', 'Furniture'];

export default { async fetch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (url.pathname !== '/api/surveys' || request.method !== 'POST') return new Response('Not found', { status: 404, headers: CORS_HEADERS });
  try {
    const body = await request.json() as Record<string, unknown>;
    const requiredText = ['uuid', 'building', 'floor', 'room', 'notes'];
    if (requiredText.some(key => typeof body[key] !== 'string') || typeof body.timestamp !== 'number' || !Number.isFinite(body.timestamp) || !categories.includes(String(body.category)) || !Number.isInteger(body.rating) || Number(body.rating) < 1 || Number(body.rating) > 5) return json({ success: false, error: 'Invalid survey payload' }, 400);
    console.log('Received survey', { uuid: body.uuid, category: body.category, timestamp: body.timestamp });
    return json({ success: true, uuid: body.uuid, receivedAt: Date.now() });
  } catch { return json({ success: false, error: 'Invalid JSON' }, 400); }
} };