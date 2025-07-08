const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');

function runCommand(command, args, cwd = rootDir) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')} in ${cwd}`);
    
    const process = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function buildApp() {
  try {
    console.log('🚀 Starting Electron app build process...\n');

    // 1. 安装根目录依赖
    console.log('📦 Installing root dependencies...');
    await runCommand('npm', ['install']);

    // 2. 安装前端依赖
    console.log('📦 Installing frontend dependencies...');
    await runCommand('npm', ['install'], path.join(rootDir, 'frontend'));

    // 3. 安装后端依赖
    console.log('📦 Installing backend dependencies...');
    await runCommand('npm', ['install'], path.join(rootDir, 'backend'));

    // 4. 构建前端
    console.log('🏗️  Building frontend...');
    await runCommand('npm', ['run', 'build'], path.join(rootDir, 'frontend'));

    // 5. 检查构建结果
    const buildPath = path.join(rootDir, 'frontend', 'build');
    if (!fs.existsSync(buildPath)) {
      throw new Error('Frontend build failed - build directory not found');
    }

    console.log('✅ Frontend build completed successfully');

    // 6. 创建.env文件（如果不存在）
    const envPath = path.join(rootDir, 'backend', '.env');
    if (!fs.existsSync(envPath)) {
      console.log('📝 Creating backend .env file...');
      const envContent = `MONGO_URL=mongodb://127.0.0.1/school
PORT=5000
NODE_ENV=production`;
      fs.writeFileSync(envPath, envContent);
    }

    console.log('✅ Build process completed successfully!');
    console.log('\n🎉 You can now run:');
    console.log('   npm run electron     - to start the app in development mode');
    console.log('   npm run dist         - to create distributable packages');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  buildApp();
}

module.exports = { buildApp };
