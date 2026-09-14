import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceLogoPath = path.resolve('public/pirivena-logo.png');
const resDir = path.resolve('android/app/src/main/res');

if (!fs.existsSync(sourceLogoPath)) {
  console.error(`❌ Source logo not found at: ${sourceLogoPath}`);
  process.exit(1);
}

console.log(`🪷 Generating Android App Icons & Splash Assets from ${sourceLogoPath}...`);

// 1. Density definitions for Android Launcher Icons
const iconSizes = [
  { folder: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { folder: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { folder: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { folder: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { folder: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

// 2. Density definitions for Splash Screens (Dark monastic theme #1c1917)
const splashSizes = [
  { folder: 'drawable', width: 480, height: 800, logoSize: 200 },
  { folder: 'drawable-port-mdpi', width: 320, height: 480, logoSize: 150 },
  { folder: 'drawable-port-hdpi', width: 480, height: 800, logoSize: 220 },
  { folder: 'drawable-port-xhdpi', width: 720, height: 1280, logoSize: 320 },
  { folder: 'drawable-port-xxhdpi', width: 960, height: 1600, logoSize: 420 },
  { folder: 'drawable-port-xxxhdpi', width: 1280, height: 1920, logoSize: 520 },
  { folder: 'drawable-land-mdpi', width: 480, height: 320, logoSize: 140 },
  { folder: 'drawable-land-hdpi', width: 800, height: 480, logoSize: 200 },
  { folder: 'drawable-land-xhdpi', width: 1280, height: 720, logoSize: 280 },
  { folder: 'drawable-land-xxhdpi', width: 1600, height: 960, logoSize: 360 },
  { folder: 'drawable-land-xxxhdpi', width: 1920, height: 1280, logoSize: 440 },
];

async function generateAssets() {
  const logoBuffer = fs.readFileSync(sourceLogoPath);

  // 1. Generate Launcher Icons (Square, Round, Foreground)
  for (const { folder, size, fgSize } of iconSizes) {
    const targetFolder = path.join(resDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // A. ic_launcher.png (Standard Icon with subtle rounded dark background)
    await sharp(logoBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 28, g: 25, b: 23, alpha: 1 } })
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher.png'));

    // B. ic_launcher_round.png (Circular Masked Icon)
    const circleSvg = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#1c1917" /></svg>`
    );
    const circleBg = await sharp(circleSvg).png().toBuffer();
    const logoResized = await sharp(logoBuffer)
      .resize(Math.round(size * 0.85), Math.round(size * 0.85), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp(circleBg)
      .composite([{ input: logoResized, gravity: 'center' }])
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher_round.png'));

    // C. ic_launcher_foreground.png (Adaptive Icon Foreground layer)
    const fgLogo = await sharp(logoBuffer)
      .resize(Math.round(fgSize * 0.65), Math.round(fgSize * 0.65), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: fgSize,
        height: fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: fgLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));

    console.log(`✅ Generated ${folder} icons (${size}x${size}, FG ${fgSize}x${fgSize})`);
  }

  // 2. Generate Splash Screens
  for (const { folder, width, height, logoSize } of splashSizes) {
    const targetFolder = path.join(resDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const centeredLogo = await sharp(logoBuffer)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 28, g: 25, b: 23, alpha: 1 }, // #1c1917 Monastic Dark Theme
      },
    })
      .composite([{ input: centeredLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(targetFolder, 'splash.png'));

    console.log(`✅ Generated ${folder}/splash.png (${width}x${height})`);
  }

  console.log('\n🎉 ALL ANDROID ICONS AND SPLASH SCREENS SUCCESSFULLY UPDATED FROM public/pirivena-logo.png!');
}

generateAssets().catch((err) => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
