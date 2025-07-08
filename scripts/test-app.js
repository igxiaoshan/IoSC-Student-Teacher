const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Electron App...\n');

const rootDir = path.join(__dirname, '..');

// 启动Electron应用进行测试
const electronProcess = spawn('npm', ['run', 'electron'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
});

console.log('📱 Starting Electron app...');
console.log('⏳ Please wait for the app to load (this may take a few seconds)');
console.log('🔍 Check if:');
console.log('   - The app window opens');
console.log('   - Backend server starts (check console output)');
console.log('   - Frontend loads correctly');
console.log('   - You can navigate through the app');
console.log('\n💡 Press Ctrl+C to stop the test\n');

electronProcess.on('close', (code) => {
  console.log(`\n✅ Test completed with code ${code}`);
});

electronProcess.on('error', (error) => {
  console.error('❌ Test failed:', error.message);
});
