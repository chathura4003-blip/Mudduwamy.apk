import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const rootDir = process.cwd();
const distDir = path.resolve(rootDir, 'dist');
const outputZip = path.resolve(rootDir, 'dist.zip');

// Read version from package.json
let appVersion = '3.8.5';
try {
  const pkgJson = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'package.json'), 'utf8'));
  if (pkgJson.version) appVersion = pkgJson.version;
} catch (e) {}

const versionedZip = path.resolve(rootDir, `SriSumanaPirivenaERP-OTA-v${appVersion}.zip`);

if (!fs.existsSync(distDir)) {
  console.error('❌ Error: "dist" folder not found! Please run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('❌ Error: "dist/index.html" is missing! Build may have failed.');
  process.exit(1);
}

try {
  console.log(`📦 [1/2] Zipping "dist" folder for Capgo Live OTA Update (v${appVersion})...`);
  const zip = new AdmZip();
  zip.addLocalFolder(distDir);
  
  // Write dist.zip
  zip.writeZip(outputZip);
  
  // Also write versioned zip
  zip.writeZip(versionedZip);

  // Auto-cleanup: Delete any older local versioned OTA zips to keep workspace clean
  let cleanedLocalCount = 0;
  try {
    const rootFiles = fs.readdirSync(rootDir);
    rootFiles.forEach((file) => {
      if (
        file.startsWith('SriSumanaPirivenaERP-OTA-v') &&
        file.endsWith('.zip') &&
        file !== path.basename(versionedZip)
      ) {
        try {
          fs.unlinkSync(path.join(rootDir, file));
          cleanedLocalCount++;
        } catch (e) {}
      }
    });
  } catch (e) {}

  const stats = fs.statSync(outputZip);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  const sizeKb = (stats.size / 1024).toFixed(0);

  console.log('\n=============================================================');
  console.log(`🎉 LIVE OTA UPDATE PACKAGE READY! (v${appVersion})`);
  console.log(`📦 File Size: ${sizeMb} MB (${sizeKb} KB)`);
  console.log(`📁 1. Capgo Standard Package: ${outputZip}`);
  console.log(`📁 2. Versioned Package: ${versionedZip}`);
  if (cleanedLocalCount > 0) {
    console.log(`🧹 Auto-Cleanup: Removed ${cleanedLocalCount} older local OTA zip backup(s)`);
  }
  console.log('=============================================================');
  console.log('\n👉 HOW TO PUBLISH (ක්‍රියාත්මක කරන ආකාරය):');
  console.log('1. Admin Dashboard වෙත Log වී "⚙️ පද්ධති සැකසුම් (Settings)" තීරුවට යන්න.');
  console.log('2. "⚡ Live OTA Updates" අංශය තෝරන්න.');
  console.log(`3. ඉහත නිර්මාණය වූ "dist.zip" ගොනුව Upload / Drag & Drop කරන්න.`);
  console.log(`4. අනුවාදය ලෙස "v${appVersion}" සටහන් කර "🚀 Live OTA නිකුත් කරන්න" බොත්තම ඔබන්න.`);
  console.log('5. සියලුම ගුරු හා ශිෂ්‍ය ජංගම දුරකථන යෙදුම් (Android Apps) ක්ෂණිකව ස්වයංක්‍රීයව Update වනු ඇත!\n');
} catch (err) {
  console.error('❌ Failed to create OTA zip package:', err);
  process.exit(1);
}
