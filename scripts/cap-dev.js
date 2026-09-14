import { execSync, spawn } from 'child_process';
import os from 'os';

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const devPort = process.env.PORT || '3000';
const devServerUrl = `http://${localIp}:${devPort}`;

console.log(`📱 Configuring Capacitor Android for Live Dev at: ${devServerUrl}...`);
process.env.CAPACITOR_DEV = 'true';
process.env.DEV_SERVER_URL = devServerUrl;

execSync('node scripts/generate-android-icons.js', { stdio: 'inherit' });
execSync('npx cap sync android', { stdio: 'inherit', env: process.env });
execSync('npx cap open android', { stdio: 'inherit', env: process.env });

console.log(`\n⚡ Starting Vite Dev Server on http://0.0.0.0:${devPort} (Network: ${devServerUrl})...`);
const isWin = process.platform === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';
spawn(npxCmd, ['vite', '--host', '0.0.0.0', '--port', devPort], {
  stdio: 'inherit',
  shell: true,
});

