// Express app assembly, kept separate from index.js's app.listen() so
// tests can import and exercise the app without binding a real port.
import express from 'express';
import cors from 'cors';
import createInterviewsRouter from './routes/interviews.js';
import createStoriesRouter from './routes/stories.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/interviews', createInterviewsRouter());
  app.use('/api/stories', createStoriesRouter());

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}
