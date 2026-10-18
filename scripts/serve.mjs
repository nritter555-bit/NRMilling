import http from 'node:http';
import { realpath, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const root = await realpath(fileURLToPath(new URL(args.includes('--dist') ? '../dist/' : '../', import.meta.url)));
const portIndex = args.lastIndexOf('--port');
const port = Number(portIndex >= 0 ? args[portIndex + 1] : process.env.PORT || 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Port invalide.');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8', '.mp4': 'video/mp4' };

const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-cache');
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    return response.end('Méthode non autorisée.');
  }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.includes('\0') || pathname.includes('\\')) throw new Error('Chemin invalide.');
    const relative = pathname.replace(/^\/+/, '') || 'index.html';
    if (relative !== 'index.html' && !relative.startsWith('src/') && !relative.startsWith('public/')) {
      response.writeHead(404);
      return response.end('Fichier introuvable.');
    }
    const path = await realpath(resolve(root, relative));
    const file = await stat(path);
    if (!path.startsWith(root + sep) || !file.isFile()) {
      response.writeHead(404);
      return response.end('Fichier introuvable.');
    }
    let start = 0;
    let end = file.size - 1;
    let status = 200;
    if (request.headers.range && extname(path).toLowerCase() === '.mp4') {
      const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      if (range && (range[1] || range[2])) {
        start = range[1] ? Number(range[1]) : Math.max(0, file.size - Number(range[2]));
        end = range[1] && range[2] ? Math.min(Number(range[2]), file.size - 1) : file.size - 1;
      }
      if (!range || (!range[1] && !range[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= file.size) {
        response.writeHead(416, { 'Content-Range': `bytes */${file.size}` });
        return response.end();
      }
      status = 206;
    }
    const headers = { 'Content-Type': mime[extname(path).toLowerCase()] || 'application/octet-stream', 'Content-Length': Math.max(0, end - start + 1), 'Accept-Ranges': 'bytes' };
    if (status === 206) headers['Content-Range'] = `bytes ${start}-${end}/${file.size}`;
    response.writeHead(status, headers);
    if (request.method === 'HEAD' || file.size === 0) return response.end();
    createReadStream(path, { start, end }).on('error', () => response.destroy()).pipe(response);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 400);
    response.end('Fichier introuvable ou adresse invalide.');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '0.0.0.0', () => console.log(`NR Milling — serveur actif sur le port ${port}.\nCtrl+C pour arrêter. Les fichiers HTML fonctionnent aussi sans serveur.`));
