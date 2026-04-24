'use strict';
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const API_KEY = process.env.API_KEY || 'mundi_tkr_api_2026';

pool.query(`
  CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`).then(() => console.log('DB ready')).catch(e => console.error('DB init error:', e.message));

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

function auth(req, res, next) {
  if (req.headers['x-api-key'] !== API_KEY) return res.status(401).json({ error: 'unauthorized' });
  next();
}

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// GET /api/kv?keys=key1,key2
app.get('/api/kv', auth, async (req, res) => {
  const keys = (req.query.keys || '').split(',').map(k => k.trim()).filter(Boolean);
  if (!keys.length) return res.json({});
  try {
    const { rows } = await pool.query('SELECT key, value FROM kv_store WHERE key = ANY($1)', [keys]);
    const out = {};
    rows.forEach(r => { out[r.key] = r.value; });
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/kv/:key  body: { value: <any> }
app.put('/api/kv/:key', auth, async (req, res) => {
  try {
    const val = req.body.value;
    await pool.query(
      `INSERT INTO kv_store (key, value, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value=$2::jsonb, updated_at=NOW()`,
      [req.params.key, JSON.stringify(val)]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/notify  body: { title, body, url?, apiKey }
app.post('/api/notify', auth, async (req, res) => {
  const { title, body, url } = req.body;
  const osAppId  = process.env.OS_APP_ID  || 'e7024ef4-2ee4-4fd4-bc99-dbe3b981e64b';
  const osApiKey = process.env.OS_API_KEY;
  if (!osApiKey) return res.status(500).json({ error: 'OS_API_KEY não configurada no servidor' });
  if (!title || !body) return res.status(400).json({ error: 'title e body são obrigatórios' });
  try {
    const payload = {
      app_id: osAppId,
      included_segments: ['All'],
      headings: { pt: title, en: title },
      contents: { pt: body,  en: body  },
    };
    if (url) payload.url = url;
    const r = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + osApiKey },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (data.errors) return res.status(400).json({ error: data.errors.join(', ') });
    res.json({ ok: true, id: data.id, recipients: data.recipients });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Mundi TKR API running on port ${PORT}`));
