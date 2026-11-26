import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  handleAdminLogin,
  handleMediaUpload,
  handleMediaDelete,
} from './api/_lib/mediaHandlers.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.disable('x-powered-by');

  // API Routes (mounted before Vite/static middleware; upload reads raw binary stream)
  app.post('/api/admin/login', express.json({ limit: '16kb' }), async (req, res) => {
    await handleAdminLogin(req, res);
  });

  app.post('/api/media/upload', async (req, res) => {
    await handleMediaUpload(req, res);
  });

  app.post('/api/media/delete', express.json({ limit: '16kb' }), async (req, res) => {
    await handleMediaDelete(req, res);
  });

  app.delete('/api/media/delete', express.json({ limit: '16kb' }), async (req, res) => {
    await handleMediaDelete(req, res);
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
