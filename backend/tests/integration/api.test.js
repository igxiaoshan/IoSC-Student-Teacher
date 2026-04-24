const request = require('supertest');
const mongoose = require('mongoose');
const Admin = require('../../models/adminSchema');
const Sclass = require('../../models/sclassSchema');
const { app } = require('../testApp');

describe('API Integration Tests', () => {
  let testAdminId;

  describe('Authentication Flow', () => {
    it('should complete full admin registration and login flow', async () => {
      // 1. 注册
      const registerRes = await request(app)
        .post('/AdminRegister')
        .send({
          name: 'Integration Admin',
          email: 'integration@test.com',
          password: 'testpass123',
          schoolName: 'Integration School'
        });

      expect(registerRes.status).toBe(200);
      testAdminId = registerRes.body._id;

      // 2. 登录
      const loginRes = await request(app)
        .post('/AdminLogIn')
        .send({
          email: 'integration@test.com',
          password: 'testpass123'
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body._id).toBe(testAdminId);
    });
  });

  describe('Class Management', () => {
    beforeEach(async () => {
      const admin = await Admin.create({
        name: 'Class Admin',
        email: 'classadmin@test.com',
        password: 'password',
        schoolName: 'Class School'
      });
      testAdminId = admin._id;
    });

    it('should create and retrieve a class', async () => {
      // 创建班级
      const createRes = await request(app)
        .post(`/SclassCreate/${testAdminId}`)
        .send({ sclassName: 'Class 10A' });

      expect(createRes.status).toBe(200);
      expect(createRes.body.sclassName).toBe('Class 10A');

      // 获取班级列表
      const listRes = await request(app)
        .get(`/SclassList/${testAdminId}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid ObjectId in params', async () => {
      const res = await request(app)
        .get('/Admin/invalid-id');

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should return 404 for non-existent routes', async () => {
      const res = await request(app)
        .get('/NonExistentRoute');

      expect(res.status).toBe(404);
    });
  });

  describe('AI Endpoints', () => {
    it('should return status for jimeng service', async () => {
      const res = await request(app)
        .get('/api/jimeng/status');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success');
    });

    it('should return workflow info', async () => {
      const res = await request(app)
        .get('/api/workflow/status');

      expect(res.status).toBe(200);
    });
  });
});