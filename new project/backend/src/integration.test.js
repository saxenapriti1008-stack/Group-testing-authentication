import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { createApp } from './app.js';
import * as store from './store.js';

vi.mock('./auth.js', () => ({
  verifyIdToken: vi.fn(async (token) => {
    if (token === 'valid-test-token') {
      return { uid: 'test-user-1', email: 'student@example.com' };
    }
    throw new Error('invalid token');
  }),
}));

function request(app, opts) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, async () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const { method, path, headers, body } = opts;
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path,
          method,
          headers: { 'Content-Type': 'application/json', ...headers },
        },
        (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            let json;
            try {
              json = text ? JSON.parse(text) : null;
            } catch {
              json = text;
            }
            server.close(() => resolve({ status: res.statusCode, body: json }));
          });
        },
      );
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

describe('integration', () => {
  let app;

  beforeEach(() => {
    store.__resetStore();
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';
    app = createApp();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('GET /gyms returns 200 and an array of gyms', async () => {
    const { status, body } = await request(app, { method: 'GET', path: '/gyms' });
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0]).toHaveProperty('name');
  });

  it('GET /gyms/:id returns 404 for unknown id', async () => {
    const { status } = await request(app, { method: 'GET', path: '/gyms/does-not-exist' });
    expect(status).toBe(404);
  });

  it('POST /gyms returns 401 without token', async () => {
    const { status } = await request(app, {
      method: 'POST',
      path: '/gyms',
      body: { name: 'New Gym' },
    });
    expect(status).toBe(401);
  });

  it('POST /gyms returns 201 with valid Bearer token', async () => {
    const { status, body } = await request(app, {
      method: 'POST',
      path: '/gyms',
      headers: { Authorization: 'Bearer valid-test-token' },
      body: { name: 'River Gym', address: '2 River Rd' },
    });
    expect(status).toBe(201);
    expect(body).toMatchObject({ name: 'River Gym', address: '2 River Rd' });
    expect(body.id).toBeDefined();
  });

  it('POST /gyms/:id/reviews returns 401 without token', async () => {
    const { status } = await request(app, {
      method: 'POST',
      path: '/gyms/seed-1/reviews',
      body: { rating: 5, comment: 'Great' },
    });
    expect(status).toBe(401);
  });
});
