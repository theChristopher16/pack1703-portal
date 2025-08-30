// Script to start Firebase emulator and check status
// This avoids getting stuck in non-returning functions

const { spawn } = require('child_process');
const { exec } = require('child_process');

console.log('🚀 Starting Firebase emulator...\n');

// Start the emulator in the background
const emulator = spawn('firebase', ['emulators:start', '--only', 'functions,firestore', '--project', 'pack-1703-portal'], {
  stdio: 'pipe',
  detached: true
});

// Give it time to start
setTimeout(() => {
  console.log('⏰ Checking emulator status...\n');
  
  // Check if emulator is running
  exec('ps aux | grep firebase | grep -v grep', (error, stdout, stderr) => {
    if (stdout) {
      console.log('✅ Firebase emulator process is running');
      console.log('Process info:', stdout.trim());
    } else {
      console.log('❌ Firebase emulator process not found');
    }
  });
  
  // Check ports
  exec('lsof -i :5001 -i :8080 -i :4000', (error, stdout, stderr) => {
    if (stdout) {
      console.log('\n✅ Ports in use:');
      console.log(stdout);
    } else {
      console.log('\n❌ No expected ports found');
    }
  });
  
  // Check emulator UI
  exec('curl -s http://127.0.0.1:4000 > /dev/null && echo "✅ Emulator UI accessible" || echo "❌ Emulator UI not accessible"', (error, stdout, stderr) => {
    console.log('\n🌐 Emulator UI status:', stdout.trim());
  });
  
  // Check functions endpoint
  exec('curl -s http://localhost:5001 > /dev/null && echo "✅ Functions endpoint accessible" || echo "❌ Functions endpoint not accessible"', (error, stdout, stderr) => {
    console.log('🔧 Functions status:', stdout.trim());
  });
  
  console.log('\n📋 Next steps:');
  console.log('1. If emulator is running, test your Cloud Functions');
  console.log('2. If not running, check the error messages above');
  console.log('3. Access emulator UI at: http://127.0.0.1:4000');
  
  process.exit(0);
}, 15000);

// Handle emulator output
emulator.stdout.on('data', (data) => {
  console.log('📤 Emulator output:', data.toString());
});

emulator.stderr.on('data', (data) => {
  console.log('⚠️  Emulator error:', data.toString());
});

// Handle emulator exit
emulator.on('close', (code) => {
  console.log(`\n🔚 Emulator process exited with code ${code}`);
});

// Handle script timeout
setTimeout(() => {
  console.log('\n⏰ Script timeout - killing emulator process');
  emulator.kill();
  process.exit(1);
}, 30000);
