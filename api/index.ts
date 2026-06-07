import express from 'express';

const app = express();

app.get('/api/test-health', async (req, res) => {
  try {
    const core = await import('./server-core');
    res.json({
      status: 'ok',
      message: 'Core imported successfully',
      time: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack,
    });
  }
});

app.all('*', async (req: any, res: any, next: any) => {
  try {
    const core = await import('./server-core');
    core.default(req, res, next);
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack,
    });
  }
});

export default app;
