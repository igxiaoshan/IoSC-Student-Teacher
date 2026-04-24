const mongoose = require('mongoose');

/**
 * 测试数据工厂
 */
const fixtures = {
  admin: {
    create: (overrides = {}) => ({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'Admin',
      ...overrides
    })
  },

  teacher: {
    create: (overrides = {}) => ({
      name: 'Test Teacher',
      email: 'teacher@test.com',
      password: 'password123',
      role: 'Teacher',
      teachSubject: 'Math',
      ...overrides
    })
  },

  student: {
    create: (overrides = {}) => ({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      role: 'Student',
      rollNum: '001',
      sclassName: new mongoose.Types.ObjectId(),
      ...overrides
    })
  },

  sclass: {
    create: (overrides = {}) => ({
      sclassName: 'Test Class',
      ...overrides
    })
  },

  subject: {
    create: (overrides = {}) => ({
      subName: 'Mathematics',
      subCode: 'MATH101',
      sessions: 3,
      ...overrides
    })
  },

  exam: {
    create: (overrides = {}) => ({
      examName: 'Midterm Exam',
      date: new Date(),
      totalMarks: 100,
      ...overrides
    })
  },

  notice: {
    create: (overrides = {}) => ({
      title: 'Test Notice',
      notice: 'This is a test notice',
      date: new Date(),
      ...overrides
    })
  }
};

module.exports = fixtures;
