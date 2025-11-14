const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Bitcoin icon as base64 PNG (1024x1024)
const createBitcoinIcon = async () => {
  const svg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f7931a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f79c1a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="512" cy="512" r="512" fill="url(#grad)"/>
  <path d="M 672 420 Q 672 360 612 345 Q 625 295 595 270 Q 565 245 515 255 L 500 195 L 455 205 L 470 265 L 425 275 L 410 215 L 365 225 L 380 285 L 285 310 L 295 360 L 335 350 Q 355 345 365 365 L 400 520 Q 405 540 385 545 L 345 555 L 360 610 L 450 585 L 465 645 L 510 635 L 495 575 L 540 565 L 555 625 L 600 615 L 585 555 Q 655 535 672 475 Q 685 425 652 400 Q 680 385 672 420 Z M 565 465 Q 560 500 495 515 L 470 415 Q 535 400 565 430 Q 570 445 565 465 Z M 520 340 Q 525 370 490 380 L 468 290 Q 503 280 520 305 Q 525 320 520 340 Z" fill="white"/>
</svg>`;

  // Android icon sizes
  const androidSizes = [
    { size: 48, path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png' },
    { size: 72, path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png' },
    { size: 96, path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png' },
    { size: 144, path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png' },
    { size: 192, path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png' },
    { size: 48, path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png' },
    { size: 72, path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png' },
    { size: 96, path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png' },
    { size: 144, path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png' },
    { size: 192, path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png' },
  ];

  // iOS icon sizes (for Contents.json in Images.xcassets/AppIcon.appiconset/)
  const iosSizes = [
    { size: 20, scale: 2, name: 'Icon-20@2x.png' },
    { size: 20, scale: 3, name: 'Icon-20@3x.png' },
    { size: 29, scale: 2, name: 'Icon-29@2x.png' },
    { size: 29, scale: 3, name: 'Icon-29@3x.png' },
    { size: 40, scale: 2, name: 'Icon-40@2x.png' },
    { size: 40, scale: 3, name: 'Icon-40@3x.png' },
    { size: 60, scale: 2, name: 'Icon-60@2x.png' },
    { size: 60, scale: 3, name: 'Icon-60@3x.png' },
    { size: 76, scale: 1, name: 'Icon-76.png' },
    { size: 76, scale: 2, name: 'Icon-76@2x.png' },
    { size: 83.5, scale: 2, name: 'Icon-83.5@2x.png' },
    { size: 1024, scale: 1, name: 'Icon-1024.png' },
  ];

  // Generate Android icons
  for (const { size, path: iconPath } of androidSizes) {
    const dir = path.dirname(iconPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(iconPath);
    console.log(`Generated: ${iconPath}`);
  }

  // Generate iOS icons
  const iosIconDir = 'ios/MonitoringApp/Images.xcassets/AppIcon.appiconset';
  for (const { size, scale, name } of iosSizes) {
    const actualSize = Math.round(size * scale);
    await sharp(Buffer.from(svg))
      .resize(actualSize, actualSize)
      .png()
      .toFile(path.join(iosIconDir, name));
    console.log(`Generated: ${path.join(iosIconDir, name)}`);
  }

  // Update iOS Contents.json
  const contentsJson = {
    images: [
      {
        size: "20x20",
        idiom: "iphone",
        filename: "Icon-20@2x.png",
        scale: "2x"
      },
      {
        size: "20x20",
        idiom: "iphone",
        filename: "Icon-20@3x.png",
        scale: "3x"
      },
      {
        size: "29x29",
        idiom: "iphone",
        filename: "Icon-29@2x.png",
        scale: "2x"
      },
      {
        size: "29x29",
        idiom: "iphone",
        filename: "Icon-29@3x.png",
        scale: "3x"
      },
      {
        size: "40x40",
        idiom: "iphone",
        filename: "Icon-40@2x.png",
        scale: "2x"
      },
      {
        size: "40x40",
        idiom: "iphone",
        filename: "Icon-40@3x.png",
        scale: "3x"
      },
      {
        size: "60x60",
        idiom: "iphone",
        filename: "Icon-60@2x.png",
        scale: "2x"
      },
      {
        size: "60x60",
        idiom: "iphone",
        filename: "Icon-60@3x.png",
        scale: "3x"
      },
      {
        size: "76x76",
        idiom: "ipad",
        filename: "Icon-76.png",
        scale: "1x"
      },
      {
        size: "76x76",
        idiom: "ipad",
        filename: "Icon-76@2x.png",
        scale: "2x"
      },
      {
        size: "83.5x83.5",
        idiom: "ipad",
        filename: "Icon-83.5@2x.png",
        scale: "2x"
      },
      {
        size: "1024x1024",
        idiom: "ios-marketing",
        filename: "Icon-1024.png",
        scale: "1x"
      }
    ],
    info: {
      version: 1,
      author: "xcode"
    }
  };

  fs.writeFileSync(
    path.join(iosIconDir, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2)
  );
  console.log('Updated iOS Contents.json');
};

createBitcoinIcon().then(() => {
  console.log('All icons generated successfully!');
}).catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
