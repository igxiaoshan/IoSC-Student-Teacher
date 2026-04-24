const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Routes = require('../../routes/route');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use('/', Routes);

// 测试用导出
let server;

const startServer = () => {
  if (!server) {
    const PORT = process.env.PORT || 5001;
    server = app.listen(PORT);
  }
  return server;
};

const closeServer = async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
    server = null;
  }
};

module.exports = { app, server: null, startServer, closeServer };
