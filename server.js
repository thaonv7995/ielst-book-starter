import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '38080', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.join(__dirname, 'dist');
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

async function handleAiProxy(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    });
    res.end();
    return;
  }

  const targetUrl = req.headers['x-target-url'];
  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing x-target-url header' }));
    return;
  }

  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);

    const forwardHeaders = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };
    if (req.headers['authorization']) {
      forwardHeaders['Authorization'] = req.headers['authorization'];
    }

    const response = await fetch(targetUrl, {
      method: req.method || 'POST',
      headers: forwardHeaders,
      body: req.method !== 'GET' && bodyBuffer.length > 0 ? bodyBuffer : undefined,
    });

    const responseHeaders = {
      'Access-Control-Allow-Origin': '*',
    };
    response.headers.forEach((val, key) => {
      const k = key.toLowerCase();
      if (k !== 'content-encoding' && k !== 'transfer-encoding' && k !== 'content-length') {
        responseHeaders[key] = val;
      }
    });

    res.writeHead(response.status, responseHeaders);

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    } else {
      res.end();
    }
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `AI Proxy Error: ${err.message}` }));
  }
}

function resolveFilePath(reqUrl) {
  const urlPath = decodeURIComponent(reqUrl.split('?')[0]);
  let safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/') safePath = '/index.html';

  // Check dist first
  const distPath = path.join(DIST_DIR, safePath);
  if (fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
    return distPath;
  }

  // Check public folder fallback (for symlinked audio or pages)
  const pubPath = path.join(PUBLIC_DIR, safePath);
  if (fs.existsSync(pubPath) && fs.statSync(pubPath).isFile()) {
    return pubPath;
  }

  // If path doesn't have an extension, serve SPA index.html
  if (!path.extname(safePath)) {
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) return indexPath;
  }

  return null;
}

function serveStaticFile(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stat = fs.statSync(filePath);
  const totalSize = stat.size;

  // Cache headers
  const isHashedAsset = filePath.includes('/assets/');
  const cacheControl = isHashedAsset
    ? 'public, max-age=31536000, immutable'
    : ext === '.html'
    ? 'no-cache'
    : 'public, max-age=86400';

  // Audio Range Requests support (HTTP 206 Partial Content)
  const rangeHeader = req.headers['range'];
  if (rangeHeader && ext === '.mp3') {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

    if (start >= totalSize || end >= totalSize || start > end) {
      res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` });
      res.end();
      return;
    }

    const chunksize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${totalSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    });

    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': totalSize,
    'Accept-Ranges': 'bytes',
    'Cache-Control': cacheControl,
    'Access-Control-Allow-Origin': '*',
  });

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  // AI Proxy Route
  if (req.url?.startsWith('/api/ai/proxy')) {
    handleAiProxy(req, res);
    return;
  }

  // Healthcheck Route
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), port: PORT }));
    return;
  }

  // Static files or SPA fallback
  const filePath = resolveFilePath(req.url || '/');
  if (filePath) {
    serveStaticFile(req, res, filePath);
  } else {
    // 404 fallback to index.html if available
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      serveStaticFile(req, res, indexPath);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🎓 IELTS MASTER GUIDE WEB - PRODUCTION SERVER               ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 Local URL:    http://localhost:${PORT}                      ║
║  🌐 Network URL:  http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}                      ║
║  🤖 AI Proxy:     http://localhost:${PORT}/api/ai/proxy          ║
║  🎵 Audio Stream: Enabled (HTTP 206 Byte Range)             ║
║  📖 Book Data:    398 Pages & Full OCR Texts Active          ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, closing server...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, closing server...');
  server.close(() => process.exit(0));
});
