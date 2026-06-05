import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './api/modules/auth/auth.route';
import employeeRoutes from './api/modules/users/users.route';
import reportRoutes from './api/modules/reports/reports.route';
import inventoryRoutes from './api/modules/inventory/inventory.route';
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/test-health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/inventory', inventoryRoutes);

// Chỉ chạy static file serving nếu không phải trên Vercel
if (!process.env.VERCEL) {
  try {
    const __dirname = path.resolve();
    app.use(express.static(path.join(__dirname, 'dist')));
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } catch (e) {
    console.error('Static file serving setup failed', e);
  }
}

// Chỉ listen port nếu không chạy trên Vercel Serverless
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`API Server running on port ${PORT}`));
}

// Export app cho Vercel
export default app;
