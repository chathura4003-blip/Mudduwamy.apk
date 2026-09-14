import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 [1/4] Building Vite Production Bundle...');
execSync('npm run build', { stdio: 'inherit' });

console.log('🪷 [2/4] Generating Android App Icons & Splash Assets from public/pirivena-logo.png...');
execSync('node scripts/generate-android-icons.js', { stdio: 'inherit' });

console.log('📱 [3/4] Syncing Capacitor Android Platform...');
execSync('npx cap sync android', { stdio: 'inherit' });

console.log('📦 [4/4] Compiling Android APKs with Gradle...');
const androidDir = path.resolve('android');
const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

// 1. Auto-detect & configure Android SDK in android/local.properties if missing
const localPropPath = path.join(androidDir, 'local.properties');
const possibleSdkPaths = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : null,
  'C:\\Android\\Sdk',
  'D:\\Android\\Sdk',
].filter(Boolean);

let sdkFound = null;
for (const p of possibleSdkPaths) {
  if (p && fs.existsSync(p)) {
    sdkFound = p;
    break;
  }
}

if (sdkFound) {
  const formatted = sdkFound.replace(/\\/g, '\\\\');
  fs.writeFileSync(localPropPath, `sdk.dir=${formatted}\n`, 'utf8');
  console.log(`✅ Using Android SDK at: ${sdkFound}`);
}

// Load local environment variables if available
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

try {
  let builtApk = null;

  // 1. Try Building Release APK
  try {
    console.log('\n🔐 Building Official Release APK...');
    execSync(`${gradlewCmd} assembleRelease`, { cwd: androidDir, stdio: 'inherit' });

    const releaseApkPath = path.resolve('android/app/build/outputs/apk/release/app-release.apk');
    const releaseUnsignedPath = path.resolve('android/app/build/outputs/apk/release/app-release-unsigned.apk');
    const releaseTargetApk = path.resolve('SriSumanaPirivenaERP-Release.apk');

    if (fs.existsSync(releaseApkPath)) {
      fs.copyFileSync(releaseApkPath, releaseTargetApk);
      builtApk = releaseTargetApk;
      console.log(`\n🎉 RELEASE APK CREATED:\n👉 ${releaseTargetApk}`);
    } else if (fs.existsSync(releaseUnsignedPath)) {
      fs.copyFileSync(releaseUnsignedPath, releaseTargetApk);
      builtApk = releaseTargetApk;
      console.log(`\n🎉 RELEASE (UNSIGNED) APK CREATED:\n👉 ${releaseTargetApk}`);
    }
  } catch (releaseErr) {
    console.warn('⚠️ Release build skipped or needs signing, building Debug APK instead...');
  }

  // 2. Build Debug APK
  console.log('\n🛠️ Building Debug APK...');
  execSync(`${gradlewCmd} assembleDebug`, { cwd: androidDir, stdio: 'inherit' });

  const debugApkPath = path.resolve('android/app/build/outputs/apk/debug/app-debug.apk');
  const debugTargetApk = path.resolve('SriSumanaPirivenaERP-debug.apk');

  if (fs.existsSync(debugApkPath)) {
    fs.copyFileSync(debugApkPath, debugTargetApk);
    if (!builtApk) builtApk = debugTargetApk;
    console.log(`\n🎉 DEBUG APK CREATED:\n👉 ${debugTargetApk}`);
  }

  console.log(`\n========================================\n🌟 APK BUILD SUCCESSFUL!\n👉 Target APK: ${builtApk || debugTargetApk}\n========================================\n`);

  // 3. Auto-install to connected ADB device if available
  try {
    const devicesOutput = execSync('adb devices', { encoding: 'utf8' });
    const hasDevice = devicesOutput.split('\n').some(line => line.includes('\tdevice'));
    if (hasDevice && builtApk) {
      console.log('\n📱 Connected USB Android device detected! Installing APK now...');
      execSync(`adb install -r "${builtApk}"`, { stdio: 'inherit' });
      console.log('✅ APK successfully installed on connected device!');
    }
  } catch (adbErr) {
    // ADB optional
  }
} catch (error) {
  console.error('\n❌ Gradle build failed:', error.message);
  console.log('\n💡 Tip: You can also open the "android" folder in Android Studio and click Run ▶️ to install directly.');
  process.exit(1);
}
