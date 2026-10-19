import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import billsRoutes from './backend/routes/bills.js';
import authRoutes from './backend/routes/auth.js';
import expenseRoutes from './backend/routes/expenses.js';
import incomeRoutes from './backend/routes/incomes.js';
import dashboardRoutes from './backend/routes/dashboard.js';
import projectRoutes from './backend/routes/project.js';
import todoRoutes from './backend/routes/todos.js';
import savingsRoutes from './backend/routes/savings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '4000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'SpendWise API Server',
      database: 'MySQL',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/incomes', incomeRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/project', projectRoutes);
  app.use('/api/todos', todoRoutes);
  app.use('/api/savings', savingsRoutes);
  app.use('/api/bills', billsRoutes);

  // Temporary diagnostic endpoint
  app.get('/debug-file', (_req, res) => {
    res.json({
      cwd: process.cwd(),
      projectRoot: __dirname,
      entryFile: path.resolve(__dirname, 'frontend/main.jsx'),
      entryExists: fs.existsSync(
        path.resolve(__dirname, 'frontend/main.jsx')
      ),
      indexExists: fs.existsSync(
        path.resolve(__dirname, 'index.html')
      ),
    });
  });

  if (!isProduction) {
    // Development: Vite serves and transforms frontend modules.
    const { createServer } = await import('vite');

    const vite = await createServer({
      configFile: path.resolve(__dirname, 'vite.config.js'),
      root: __dirname,
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);

 
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const indexPath = path.join(distPath, 'index.html');

    if (!fs.existsSync(indexPath)) {
      throw new Error(
        `Production build not found: ${indexPath}. Run npm run build first.`
      );
    }

    app.use(
      express.static(distPath, {
        index: false,
      })
    );

    // Missing static assets must return 404, not the SPA HTML.
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }

      const isAsset =
        req.path.startsWith('/assets/') ||
        /\.[a-zA-Z0-9]+$/.test(req.path);

      if (isAsset) {
        return res.status(404).type('text/plain').send(
          `Asset not found: ${req.path}`
        );
      }

      next();
    });

    // React SPA fallback for browser navigation.
    app.get('*', (req, res, next) => {
      if (!req.accepts('html')) {
        return next();
      }

      res.sendFile(indexPath, (err) => {
        if (err) {
          next(err);
        }
      });
    });
  }

  // Error handler
  app.use((err, _req, res, _next) => {
    console.error('Request error:', err);

    if (res.headersSent) {
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      ...(process.env.NODE_ENV !== 'production' && {
        message: err.message,
      }),
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `SpendWise Full-Stack Server running at http://localhost:${PORT}`
    );
    console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
