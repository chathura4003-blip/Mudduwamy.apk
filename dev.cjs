const { spawn } = require('child_process');

console.log('Starting Vite development server...');

const isWin = process.platform === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

const vite = spawn(npxCmd, ['vite', '--host', '0.0.0.0', '--port', '3000'], {
  stdio: 'inherit',
  shell: true,
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
});

process.on('SIGINT', () => {
  vite.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  vite.kill('SIGTERM');
  process.exit();
});
