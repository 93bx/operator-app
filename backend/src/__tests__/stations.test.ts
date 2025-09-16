import request from 'supertest';
import express from 'express';
import stationRoutes from '../routes/stations';
import authRoutes from '../routes/auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);

describe('Station Routes', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@operator.com',
        password: 'admin123'
      });

    authToken = loginResponse.body.data.token;
    userId = loginResponse.body.data.user.id;
  });

  describe('GET /api/stations', () => {
    it('should get all stations', async () => {
      const response = await request(app)
        .get('/api/stations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject request without auth token', async () => {
      const response = await request(app)
        .get('/api/stations');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/stations', () => {
    it('should create a new station', async () => {
      const stationData = {
        name: 'Test Station',
        nameAr: 'محطة اختبار',
        locationName: 'Test Location',
        locationNameAr: 'موقع اختبار',
        latitude: 33.5138,
        longitude: 36.2765,
        address: '123 Test Street',
        addressAr: 'شارع الاختبار 123',
        capacityLiters: 50000
      };

      const response = await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(stationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(stationData.name);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Station'
          // missing other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate coordinates', async () => {
      const response = await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Station',
          nameAr: 'محطة اختبار',
          locationName: 'Test Location',
          locationNameAr: 'موقع اختبار',
          latitude: 200, // Invalid latitude
          longitude: 36.2765
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/stations/:id', () => {
    let stationId: string;

    beforeAll(async () => {
      // Create a station first
      const response = await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Station for Get',
          nameAr: 'محطة اختبار للحصول',
          locationName: 'Test Location',
          locationNameAr: 'موقع اختبار',
          latitude: 33.5138,
          longitude: 36.2765
        });

      stationId = response.body.data.id;
    });

    it('should get station by id', async () => {
      const response = await request(app)
        .get(`/api/stations/${stationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(stationId);
    });

    it('should return 404 for non-existent station', async () => {
      const response = await request(app)
        .get('/api/stations/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
