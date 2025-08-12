const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/server');
const path = require('path');

describe('Quality routes', () => {
  let token;
  let server;

  beforeEach(async () => {
    const mongoURI = process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/car-sales-ai-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI);
      server = app.listen(0);
    }
    // Register via API to obtain a valid token
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ firstName: 'QA', lastName: 'Tester', dealership: 'Test Dealer', email: 'qa@example.com', password: 'pass1234' });
    token = registerRes.body.token;
  });

  afterAll(async () => {
    try { await mongoose.connection.close(); } catch {}
    try { if (server) server.close(); } catch {}
  });

  test('POST /api/quality/assess (single) returns id', async () => {
    const res = await request(app)
      .post('/api/quality/assess')
      .set('Authorization', `Bearer ${token}`)
      .send({
        imagePath: path.join(__dirname, 'fixtures', 'processed.png'),
        originalPath: path.join(__dirname, 'fixtures', 'original.jpg'),
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id || res.body.data?.id).toBeDefined();
  });

  test('POST /api/quality/assess (batch) returns ids', async () => {
    const images = [1, 2, 3].map((i) => ({
      imagePath: path.join(__dirname, 'fixtures', `p${i}.png`),
      originalPath: path.join(__dirname, 'fixtures', `o${i}.jpg`),
    }));
    const res = await request(app)
      .post('/api/quality/assess')
      .set('Authorization', `Bearer ${token}`)
      .send({ images });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const ids = res.body.data.ids || res.body.data?.ids;
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBe(3);
  });

  test('GET /api/quality returns list', async () => {
    const res = await request(app)
      .get('/api/quality')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('Review flow: create -> list -> review -> get', async () => {
    // create
    const createRes = await request(app)
      .post('/api/quality/assess')
      .set('Authorization', `Bearer ${token}`)
      .send({
        imagePath: path.join(__dirname, 'fixtures', 'x1.png'),
        originalPath: path.join(__dirname, 'fixtures', 'y1.jpg'),
      });
    const id = createRes.body.data.id || createRes.body.data?.id;
    expect(id).toBeDefined();

    // list & ensure present
    const listRes = await request(app)
      .get('/api/quality')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    const found = (listRes.body.data || []).find((a) => a.id === id);
    expect(found).toBeDefined();

    // review
    const reviewRes = await request(app)
      .post(`/api/quality/${id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ approved: true, notes: 'Looks good', qualityScore: 90 });
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.success).toBe(true);
    expect(reviewRes.body.data.reviewed).toBe(true);

    // get
    const getRes = await request(app)
      .get(`/api/quality/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.id).toBe(id);
  });
});


