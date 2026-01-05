const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Seeded random for reproducibility
let seed = 12345;
function random() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

async function zombifyImage(inputPath, outputPath) {
  // Read the image
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();

  // Get raw pixel data (ensure RGBA)
  const rawBuffer = await image.ensureAlpha().raw().toBuffer();
  const pixels = new Uint8Array(rawBuffer);

  // Process each pixel
  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];
    let a = pixels[i + 3];

    if (a === 0) continue; // Skip transparent pixels

    // 1. Apply zombie green/gray tint
    const gray = r * 0.299 + g * 0.587 + b * 0.114;
    r = Math.floor(r * 0.5 + gray * 0.3 + 20);
    g = Math.floor(g * 0.6 + gray * 0.4 + 40); // More green
    b = Math.floor(b * 0.4 + gray * 0.3);

    // 2. Darken overall
    r = Math.floor(r * 0.75);
    g = Math.floor(g * 0.8);
    b = Math.floor(b * 0.7);

    // 3. Add random dirt/grime spots
    if (random() < 0.12) {
      const dirtAmount = random() * 35 + 15;
      r = Math.max(0, r - dirtAmount);
      g = Math.max(0, g - dirtAmount * 0.8);
      b = Math.max(0, b - dirtAmount * 0.6);
    }

    // 4. Add occasional blood/wound spots (dark red)
    if (random() < 0.02) {
      r = Math.min(255, r + 50);
      g = Math.max(0, g - 25);
      b = Math.max(0, b - 25);
    }

    // 5. Add decay texture variation
    const noiseR = (random() - 0.5) * 15;
    const noiseG = (random() - 0.5) * 12;
    const noiseB = (random() - 0.5) * 18;

    r = Math.max(0, Math.min(255, r + noiseR));
    g = Math.max(0, Math.min(255, g + noiseG));
    b = Math.max(0, Math.min(255, b + noiseB));

    pixels[i] = Math.floor(r);
    pixels[i + 1] = Math.floor(g);
    pixels[i + 2] = Math.floor(b);
    // Keep original alpha
  }

  // Write the zombified image
  await sharp(Buffer.from(pixels), {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toFile(outputPath);
}

async function main() {
  const playerImagesDir = path.join(__dirname, "../spine/player/images");
  const zombieImagesDir = path.join(__dirname, "../spine/zombie/images");

  // Ensure zombie images directory exists
  if (!fs.existsSync(zombieImagesDir)) {
    fs.mkdirSync(zombieImagesDir, { recursive: true });
  }

  // Images to zombify (body parts only - upper body, legs are separate)
  const bodyParts = [
    { src: "head.png", dst: "head.png" },
    { src: "torso.png", dst: "torso.png" },
    { src: "arm.png", dst: "arm.png" },
    { src: "forearm.png", dst: "forearm.png" },
    { src: "hand_fist.png", dst: "hand.png" },
  ];

  console.log("Zombifying player textures...\n");

  for (const part of bodyParts) {
    const srcPath = path.join(playerImagesDir, part.src);
    const dstPath = path.join(zombieImagesDir, part.dst);

    if (!fs.existsSync(srcPath)) {
      console.log(`Skipping ${part.src} (not found)`);
      continue;
    }

    // Reset seed for each image for consistent results
    seed = 12345 + part.src.charCodeAt(0) * 1000;

    try {
      await zombifyImage(srcPath, dstPath);
      const meta = await sharp(dstPath).metadata();
      console.log(
        `✓ ${part.src} -> ${part.dst} (${meta.width}x${meta.height})`
      );
    } catch (err) {
      console.log(`✗ ${part.src}: ${err.message}`);
    }
  }

  console.log("\nZombie textures created in spine/zombie/images/");
}

main().catch(console.error);
