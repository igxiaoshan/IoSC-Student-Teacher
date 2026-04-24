const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const healthRoutes = require('../../routes/healthRoutes');

const app = express();
app.use(express.json());
app.use('/api', healthRoutes);

describe('Health Controller', () => {
  describe('GET /api/health', () => {
    it('should return basic health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/health/detail', () => {
    it('should return detailed health with database status', async () => {
      const res = await request(app).get('/api/health/detail');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('checks');
      expect(res.body.checks).toHaveProperty('server');
      expect(res.body.checks).toHaveProperty('database');
      expect(res.body.checks).toHaveProperty('system');
    });
  });

  describe('GET /api/ready', () => {
    it('should return ready status when database connected', async () => {
      const res = await request(app).get('/api/ready');

      // 根据数据库连接状态判断
      if (mongoose.connection.readyState === 1) {
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ready');
      } else {
        expect(res.status).toBe(503);
        expect(res.body.status).toBe('not_ready');
      }
    });
  });

  describe('GET /api/live', () => {
    it('should always return alive status', async () => {
      const res = await request(app).get('/api/live');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('alive');
    });
  });

  describe('GET /api/metrics', () => {
    it('should return JSON metrics by default', async () => {
      const res = await request(app).get('/api/metrics');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('process');
      expect(res.body).toHaveProperty('system');
      expect(res.body).toHaveProperty('database');
    });

    it('should return Prometheus format when requested', async () => {
      const res = await request(app).get('/api/metrics?format=prometheus');

      expect(res.status).toBe(200);
      expect(res.text).toContain('process_uptime_seconds');
      expect(res.text).toContain('process_memory_heap_used_bytes');
      expect(res.text).toContain('database_connection_state');
    });
  });
});