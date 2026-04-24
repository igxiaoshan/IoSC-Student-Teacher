const mongoose = require('mongoose');

/**
 * 清理测试数据库
 */
async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * 关闭数据库连接
 */
async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
}

module.exports = {
  clearDatabase,
  closeDatabase
};
