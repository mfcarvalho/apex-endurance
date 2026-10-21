import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ...['bootstrap.js', 'game.js', 'race-core.js', 'three.module.js']
    .map(file => [`/${file}`, [file, 'text/javascript; charset=utf-8']]),
]);

const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, {Allow: 'GET, HEAD'}).end();
    return;
  }
  let pathname;
  try {
    pathname = new URL(request.url, 'http://localhost').pathname;
  } catch {
    response.writeHead(400).end('Requisição inválida.');
    return;
  }
  if (pathname === '/favicon.ico') {
    response.writeHead(204).end();
    return;
  }
  const file = files.get(pathname);
  if (!file) {
    response.writeHead(404).end('Arquivo não encontrado.');
    return;
  }
  try {
    const body = await readFile(new URL(file[0], root));
    response.writeHead(200, {'Content-Type': file[1], 'Content-Length': body.length});
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    console.error(`Não foi possível ler ${file[0]}: ${error.message}`);
    response.writeHead(500).end('Falha ao carregar arquivo do jogo.');
  }
});

let port = 8000;
server.on('error', error => {
  if (error.code === 'EADDRINUSE' && port < 8009) {
    console.log(`Porta ${port} ocupada. Tentando ${port + 1}…`);
    port++;
    server.listen(port, '127.0.0.1');
    return;
  }
  console.error(error.code === 'EADDRINUSE'
    ? 'As portas 8000–8009 estão ocupadas. Encerre um servidor anterior e tente novamente.'
    : `Não foi possível iniciar o servidor: ${error.message}`);
  process.exitCode = 1;
});
server.on('listening', () => {
  console.log(`APEX — GT Endurance: http://localhost:${port}`);
  console.log('Pressione Ctrl+C para encerrar.');
});
server.listen(port, '127.0.0.1');
