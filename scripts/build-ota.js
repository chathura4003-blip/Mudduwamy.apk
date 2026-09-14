import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

console.log('\n🚀 =============================================================');
console.log('🌟 SRI SUMANA MAHA PIRIVENA ERP - LIVE OTA BUNDLE BUILDER');
console.log('=============================================================\n');

try {
  // 1. Build Vite Production Bundle
  console.log('📦 [1/2] Compiling Production Bundle with Vite...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Create Live OTA Zip package
  console.log('\n🗜️ [2/2] Generating Capgo Live OTA Zip Distribution Package...');
  execSync('node scripts/create-live-zip.js', { stdio: 'inherit' });

} catch (error) {
  console.error('\n❌ Build process terminated with error:', error.message);
  process.exit(1);
}
