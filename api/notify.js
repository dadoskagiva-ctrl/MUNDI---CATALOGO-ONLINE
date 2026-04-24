'use strict';
const API_KEY = process.env.API_KEY || 'mundi_tkr_api_2026';
const OS_APP_ID = process.env.OS_APP_ID || 'e7024ef4-2ee4-4fd4-bc99-dbe3b981e64b';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers['x-api-key'] !== API_KEY) return res.status(401).json({ error: 'unauthorized' });

  const { title, body, url } = req.body || {};
  const osApiKey = process.env.OS_API_KEY;
  if (!osApiKey) return res.status(500).json({ error: 'OS_API_KEY não configurada no servidor' });
  if (!title || !body) return res.status(400).json({ error: 'title e body são obrigatórios' });

  const payload = {
    app_id: OS_APP_ID,
    included_segments: ['All'],
    headings: { pt: title, en: title },
    contents: { pt: body, en: body }
  };
  if (url) payload.url = url;

  const r = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Key ' + osApiKey
    },
    body: JSON.stringify(payload)
  });
  const data = await r.json();
  if (data.errors) return res.status(400).json({ error: data.errors.join(', ') });
  res.json({ ok: true, id: data.id, recipients: data.recipients });
};
