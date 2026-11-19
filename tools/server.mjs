import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Set(['index.html', 'styles.css', 'app.js', 'game.js', 'board.js', 'firebase-config.js', 'leaderboard.js']);
const types = { html: 'text/html', css: 'text/css', js: 'text/javascript' };
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';

createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const path = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!files.has(path)) {
    response.writeHead(404).end('Halaman tidak ditemukan.');
    return;
  }
  try {
    const data = await readFile(new URL(`../${path}`, import.meta.url));
    const type = types[path.split('.').at(-1)];
    response.writeHead(200, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch {
    response.writeHead(500).end('File belum tersedia.');
  }
}).listen(port, host, () => console.log(`Vector Racer · http://${host}:${port}`));
