'use strict';
const { Pool } = require('pg');

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const body = req.body || {};
    const purchase = body.data?.purchase || body.purchase || body;
    const productName = (
      purchase?.product?.name ||
      purchase?.order?.product_name ||
      body?.product?.name || ''
    ).toLowerCase();
    const status = (purchase?.status || body?.status || 'paid').toLowerCase();

    if (!['paid', 'approved', 'complete', 'completed', 'active'].includes(status)) {
      return res.json({ ok: true, skipped: true, status });
    }

    const isAnual = productName.includes('anual') || productName.includes('ano');
    const isPro   = productName.includes('pro');
    const days    = isAnual ? 365 : 30;
    const plan    = isPro ? 'pro' : 'essencial';

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1
    });

    const { rows } = await pool.query(
      "SELECT value FROM kv_store WHERE key = 'mundi:subscription'"
    );
    const current = rows[0]?.value || {};
    const newSub = {
      ...current,
      plan,
      expiresAt: addDays(days),
      activatedAt: new Date().toISOString(),
      activatedBy: 'kiwify',
      buyerEmail: purchase?.buyer?.email || purchase?.customer?.email || '',
      buyerName:  purchase?.buyer?.name  || purchase?.customer?.name  || '',
    };

    await pool.query(
      `INSERT INTO kv_store (key, value, updated_at) VALUES ('mundi:subscription', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value=$1::jsonb, updated_at=NOW()`,
      [JSON.stringify(newSub)]
    );
    await pool.end();

    console.log(`Kiwify: ${plan} ativado ${days}d — ${newSub.buyerEmail}`);
    res.json({ ok: true, plan, days, expiresAt: newSub.expiresAt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
