import { kv } from '@vercel/kv';

const ATHLETE_IDS = ['adrileal', 'cubo', 'juanes', 'juanjo', 'martin', 'marujas', 'ander'];
const KEY = 'cacao:events';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const raw = await kv.lrange(KEY, 0, -1);
      const events = (raw || []).map(function (x) {
        return typeof x === 'string' ? JSON.parse(x) : x;
      });
      return res.status(200).json({ events: events });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const athleteId = String(body.athleteId || '');
      const delta = Number(body.delta);
      if (ATHLETE_IDS.indexOf(athleteId) === -1 || !Number.isFinite(delta) || Math.abs(delta) > 10 || delta === 0) {
        return res.status(400).json({ error: 'invalid input' });
      }
      const event = { athleteId: athleteId, delta: delta, ts: new Date().toISOString() };
      await kv.rpush(KEY, JSON.stringify(event));
      await kv.ltrim(KEY, -500, -1);
      return res.status(200).json({ ok: true, event: event });
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'server error', detail: String((e && e.message) || e) });
  }
}
