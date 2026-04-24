const request = require('supertest');
const mongoose = require('mongoose');
const Admin = require('../../models/adminSchema');
const { app, server } = require('./testApp');
const fixtures = require('../helpers/fixtures');

describe('Admin Controller', () => {
  describe('POST /api/admin/register', () => {
    it('should register a new admin successfully', async () => {
      const adminData = {
        name: 'New Admin',
        email: 'newadmin@test.com',
        password: 'password123',
        schoolName: 'Test School'
      };

      const res = await request(app)
        .post('/AdminRegister')
        .send(adminData);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(adminData.name);
      expect(res.body.email).toBe(adminData.email);
      expect(res.body.password).toBeUndefined();
    });

    it('should return error if email already exists', async () => {
      const adminData = {
        name: 'Admin One',
        email: 'existing@test.com',
        password: 'password123',
        schoolName: 'School One'
      };

      await Admin.create(adminData);

      const res = await request(app)
        .post('/AdminRegister')
        .send({
          name: 'Admin Two',
          email: 'existing@test.com',
          password: 'password456',
          schoolName: 'School Two'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('邮箱已存在');
    });

    it('should return error if school name already exists', async () => {
      const adminData = {
        name: 'Admin One',
        email: 'admin1@test.com',
        password: 'password123',
        schoolName: 'Existing School'
      };

      await Admin.create(adminData);

      const res = await request(app)
        .post('/AdminRegister')
        .send({
          name: 'Admin Two',
          email: 'admin2@test.com',
          password: 'password456',
          schoolName: 'Existing School'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('学校名称已存在');
    });
  });

  describe('POST /api/admin/login', () => {
    beforeEach(async () => {
      await Admin.create({
        name: 'Login Admin',
        email: 'login@test.com',
        password: 'correctpassword',
        schoolName: 'Login School'
      });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/AdminLogIn')
        .send({
          email: 'login@test.com',
          password: 'correctpassword'
        });

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('login@test.com');
      expect(res.body.password).toBeUndefined();
    });

    it('should return error with wrong password', async () => {
      const res = await request(app)
        .post('/AdminLogIn')
        .send({
          email: 'login@test.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('无效密码');
    });

    it('should return error for non-existent user', async () => {
      const res = await request(app)
        .post('/AdminLogIn')
        .send({
          email: 'nonexistent@test.com',
          password: 'password'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('用户未找到');
    });

    it('should return error when email or password missing', async () => {
      const res = await request(app)
        .post('/AdminLogIn')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('邮箱和密码是必需的');
    });
  });

  describe('GET /api/admin/:id', () => {
    let testAdmin;

    beforeEach(async () => {
      testAdmin = await Admin.create({
        name: 'Detail Admin',
        email: 'detail@test.com',
        password: 'password123',
        schoolName: 'Detail School'
      });
    });

    it('should return admin details', async () => {
      const res = await request(app)
        .get(`/Admin/${testAdmin._id}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Detail Admin');
      expect(res.body.password).toBeUndefined();
    });

    it('should return error for non-existent admin', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/Admin/${fakeId}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('没有找到管理员');
    });
  });
});
