import { defineConfig, Plugin } from 'vite';

function aiProxyPlugin(): Plugin {
  const handler = async (req: any, res: any) => {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.statusCode = 204;
      res.end();
      return;
    }

    const targetUrl = req.headers['x-target-url'] as string;
    if (!targetUrl) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing x-target-url header' }));
      return;
    }

    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const bodyBuffer = Buffer.concat(chunks);

      const forwardHeaders: Record<string, string> = {
        'Content-Type': (req.headers['content-type'] as string) || 'application/json',
      };
      if (req.headers['authorization']) {
        forwardHeaders['Authorization'] = req.headers['authorization'] as string;
      }

      const response = await fetch(targetUrl, {
        method: req.method || 'POST',
        headers: forwardHeaders,
        body: req.method !== 'GET' && bodyBuffer.length > 0 ? bodyBuffer : undefined,
      });

      res.statusCode = response.status;
      response.headers.forEach((val, key) => {
        const k = key.toLowerCase();
        if (k !== 'content-encoding' && k !== 'transfer-encoding' && k !== 'content-length') {
          res.setHeader(key, val);
        }
      });

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
    } catch (err: any) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `AI Proxy Error: ${err.message}` }));
    }
  };

  return {
    name: 'ai-proxy',
    configureServer(server) {
      server.middlewares.use('/api/ai/proxy', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/ai/proxy', handler);
    },
  };
}

export default defineConfig({
  plugins: [aiProxyPlugin()],
  server: {
    port: 3000,
    open: false,
    fs: {
      allow: ['..'],
    },
  },
  preview: {
    port: 38080,
    open: false,
  },
});
