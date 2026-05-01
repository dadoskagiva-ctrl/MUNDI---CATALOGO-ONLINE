'use strict';
// Versão gerada automaticamente pelo Vercel a cada deploy
// VERCEL_GIT_COMMIT_SHA é único por deploy e fixo dentro do mesmo deploy
const VERSION = process.env.VERCEL_GIT_COMMIT_SHA
  ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 10)
  : 'local-' + Math.floor(Date.now() / 30000);

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Content-Type', 'application/json');
  res.json({ v: VERSION });
};
