import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const root = await realpath(fileURLToPath(new URL(args.includes('--dist') ? '../dist/' : '../', import.meta.url)));
const portIndex = args.lastIndexOf('--port');
const port = Number(portIndex >= 0 ? args[portIndex + 1] : process.env.PORT || 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Port invalide.');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8' };

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
    if (!path.startsWith(root + sep) || !(await stat(path)).isFile()) {
      response.writeHead(404);
      return response.end('Fichier introuvable.');
    }
    const contents = await readFile(path);
    response.writeHead(200, { 'Content-Type': mime[extname(path).toLowerCase()] || 'application/octet-stream', 'Content-Length': contents.length });
    response.end(request.method === 'HEAD' ? undefined : contents);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 400);
    response.end('Fichier introuvable ou adresse invalide.');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '0.0.0.0', () => console.log(`NR Milling — serveur actif sur le port ${port}.\nCtrl+C pour arrêter. Les fichiers HTML fonctionnent aussi sans serveur.`));
