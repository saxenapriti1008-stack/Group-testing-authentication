import express from 'express';
import cors from 'cors';
import * as store from './store.js';
import { verifyToken } from './middleware/verifyToken.js';

export function createApp() {
  const app = express();
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  app.use(
    cors({
      origin: clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get('/gyms', (_req, res) => {
    res.json(store.listGyms());
  });

  app.get('/gyms/:id', (req, res) => {
    const gym = store.getGym(req.params.id);
    if (!gym) return res.status(404).json({ error: 'Not found' });
    res.json(gym);
  });

  app.post('/gyms', verifyToken, (req, res) => {
    const { name, address } = req.body ?? {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    const gym = store.createGym({ name, address }, req.user.uid);
    res.status(201).json(gym);
  });

  app.post('/gyms/:id/reviews', verifyToken, (req, res) => {
    const { rating, comment } = req.body ?? {};
    if (rating === undefined || Number.isNaN(Number(rating))) {
      return res.status(400).json({ error: 'rating is required' });
    }
    const review = store.addReview(req.params.id, { rating, comment }, req.user.uid);
    if (!review) return res.status(404).json({ error: 'Not found' });
    res.status(201).json(review);
  });

  app.get('/profile', verifyToken, (req, res) => {
    res.json({ user: req.user });
  });

  return app;
}
