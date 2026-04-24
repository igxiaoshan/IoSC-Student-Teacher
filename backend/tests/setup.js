const mongoose = require('mongoose');

// 测试环境变量
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1/school_test';

// 测试超时
jest.setTimeout(30000);

// 全局 beforeAll - 连接测试数据库
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 5
    });
  }
});

// 全局 afterAll - 清理并断开连接
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});

// 全局 afterEach - 清理集合
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Mock console.log 在测试中减少噪音
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
