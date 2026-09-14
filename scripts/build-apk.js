import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 [1/4] Building Vite Production Bundle...');
execSync('npm run build', { stdio: 'inherit' });

console.log('🪷 [2/4] Generating Android App Icons & Splash Assets from public/pirivena-logo.png...');
execSync('node scripts/generate-android-icons.js', { stdio: 'inherit' });

console.log('📱 [3/4] Syncing Capacitor Android Platform...');
execSync('npx cap sync android', { stdio: 'inherit' });

console.log('📦 [4/4] Compiling Android Release (Signed) and Debug APKs with Gradle...');
const androidDir = path.resolve('android');
const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

try {
  // 1. Build Official Signed Release APK (for general distribution without Play Protect flags)
  console.log('\n🔐 Building Official Signed Release APK...');
  execSync(`${gradlewCmd} assembleRelease`, { cwd: androidDir, stdio: 'inherit' });

  const releaseApkPath = path.resolve('android/app/build/outputs/apk/release/app-release.apk');
  const releaseTargetApk = path.resolve('SriSumanaPirivenaERP-Release.apk');

  if (fs.existsSync(releaseApkPath)) {
    fs.copyFileSync(releaseApkPath, releaseTargetApk);
    console.log(`\n🎉 OFFICIAL SIGNED RELEASE APK CREATED:\n👉 ${releaseTargetApk}\n👉 ${releaseApkPath}`);
  }

  // 2. Also build Debug APK
  console.log('\n🛠️ Building Debug APK...');
  execSync(`${gradlewCmd} assembleDebug`, { cwd: androidDir, stdio: 'inherit' });

  const debugApkPath = path.resolve('android/app/build/outputs/apk/debug/app-debug.apk');
  const debugTargetApk = path.resolve('SriSumanaPirivenaERP-debug.apk');

  if (fs.existsSync(debugApkPath)) {
    fs.copyFileSync(debugApkPath, debugTargetApk);
  }

  console.log(`\n========================================\n🌟 APK BUILD SUMMARY:\n👉 Shareable Release APK: ${releaseTargetApk}\n👉 Debug APK: ${debugTargetApk}\n========================================\n`);
} catch (error) {
  console.error('❌ Gradle build failed:', error.message);
  process.exit(1);
}
