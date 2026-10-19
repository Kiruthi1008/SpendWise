import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
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
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'SpendWise API Server',
      database: 'MySQL',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/incomes', incomeRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/project', projectRoutes);
  app.use('/api/todos', todoRoutes);
  app.use('/api/savings', savingsRoutes);
  app.use('/api/bills', billsRoutes);

  if (!isProduction) {
    const { createServer } = await import('vite');

    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');

    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `🚀 SpendWise Full-Stack Server running at http://0.0.0.0:${PORT}`
    );
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});