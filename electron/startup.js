const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class AppStartup {
  constructor() {
    this.backendProcess = null;
    this.mongoProcess = null;
  }

  // 检查MongoDB是否已经在运行
  async checkMongoRunning() {
    return new Promise((resolve) => {
      const testProcess = spawn('mongosh', ['--eval', 'db.runCommand("ping")'], {
        stdio: 'pipe'
      });

      testProcess.on('close', (code) => {
        resolve(code === 0);
      });

      testProcess.on('error', () => {
        resolve(false);
      });
    });
  }

  // 启动MongoDB（如果需要）
  async startMongoDB() {
    const isRunning = await this.checkMongoRunning();
    if (isRunning) {
      console.log('MongoDB is already running');
      return true;
    }

    console.log('Starting MongoDB...');
    
    // 尝试启动MongoDB服务
    return new Promise((resolve) => {
      // Windows
      if (process.platform === 'win32') {
        this.mongoProcess = spawn('net', ['start', 'MongoDB'], {
          stdio: 'pipe'
        });
      } 
      // macOS/Linux
      else {
        this.mongoProcess = spawn('mongod', [], {
          stdio: 'pipe'
        });
      }

      this.mongoProcess.on('close', (code) => {
        if (code === 0) {
          console.log('MongoDB started successfully');
          resolve(true);
        } else {
          console.log('Failed to start MongoDB, assuming it\'s already running or using Atlas');
          resolve(true); // 继续执行，可能使用的是Atlas
        }
      });

      this.mongoProcess.on('error', (err) => {
        console.log('MongoDB start error (this is normal if using Atlas):', err.message);
        resolve(true); // 继续执行
      });

      // 超时处理
      setTimeout(() => {
        console.log('MongoDB startup timeout, continuing...');
        resolve(true);
      }, 10000);
    });
  }

  // 启动后端服务器
  startBackendServer() {
    const backendPath = path.join(__dirname, '..', 'backend');
    const serverScript = path.join(backendPath, 'index.js');
    
    console.log('Starting backend server...');
    console.log('Backend path:', backendPath);
    
    // 检查.env文件是否存在
    const envPath = path.join(backendPath, '.env');
    if (!fs.existsSync(envPath)) {
      console.log('Creating .env file from template...');
      const envExamplePath = path.join(backendPath, '.env.example');
      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
      } else {
        // 创建默认.env文件
        fs.writeFileSync(envPath, 'MONGO_URL=mongodb://127.0.0.1/school\nPORT=5000\nNODE_ENV=production\n');
      }
    }
    
    this.backendProcess = spawn('node', [serverScript], {
      cwd: backendPath,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '5000'
      },
      stdio: 'pipe'
    });

    this.backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });

    this.backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    this.backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });

    return this.backendProcess;
  }

  // 启动完整应用
  async startApp() {
    try {
      // 1. 启动MongoDB
      await this.startMongoDB();
      
      // 2. 等待一下让MongoDB完全启动
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 3. 启动后端服务器
      const backend = this.startBackendServer();
      
      return backend;
    } catch (error) {
      console.error('Failed to start app:', error);
      throw error;
    }
  }

  // 清理进程
  cleanup() {
    if (this.backendProcess) {
      console.log('Terminating backend process...');
      this.backendProcess.kill();
    }
    
    // 注意：通常不需要手动关闭MongoDB，让它继续运行
    // if (this.mongoProcess) {
    //   console.log('Terminating MongoDB process...');
    //   this.mongoProcess.kill();
    // }
  }
}

module.exports = AppStartup;
