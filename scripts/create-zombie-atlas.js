const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function main() {
  const zombieImagesDir = path.join(__dirname, "../spine/zombie/images");
  const assetsDir = path.join(__dirname, "../src/assets/spine");

  // Images for the zombie atlas (upper body only - legs are separate)
  const imageFiles = [
    { name: "head", file: "head.png" },
    { name: "torso", file: "torso.png" },
    { name: "arm", file: "arm.png" },
    { name: "forearm", file: "forearm.png" },
    { name: "hand", file: "hand.png" },
  ];

  console.log("Creating zombie atlas from zombified textures...\n");

  // Load all images and get their metadata
  const images = [];
  for (const imgInfo of imageFiles) {
    const imgPath = path.join(zombieImagesDir, imgInfo.file);

    if (!fs.existsSync(imgPath)) {
      console.log(`Warning: ${imgInfo.file} not found, skipping`);
      continue;
    }

    try {
      const meta = await sharp(imgPath).metadata();
      images.push({
        name: imgInfo.name,
        path: imgPath,
        width: meta.width,
        height: meta.height,
      });
      console.log(`Loaded: ${imgInfo.name} (${meta.width}x${meta.height})`);
    } catch (err) {
      console.log(`Error loading ${imgInfo.file}: ${err.message}`);
    }
  }

  if (images.length === 0) {
    console.error("No images loaded! Run zombify-textures.js first.");
    process.exit(1);
  }

  // Sort by height descending for better packing
  images.sort((a, b) => b.height - a.height);

  // Simple shelf packing
  const padding = 2;
  let atlasWidth = 256;
  let currentX = padding;
  let currentY = padding;
  let shelfHeight = 0;

  for (const img of images) {
    if (currentX + img.width + padding > atlasWidth) {
      // Start new shelf
      currentX = padding;
      currentY += shelfHeight + padding;
      shelfHeight = 0;
    }

    img.x = currentX;
    img.y = currentY;

    currentX += img.width + padding;
    shelfHeight = Math.max(shelfHeight, img.height);
  }

  // Calculate final atlas height (power of 2)
  const neededHeight = currentY + shelfHeight + padding;
  let atlasHeight = 128;
  while (atlasHeight < neededHeight) {
    atlasHeight *= 2;
  }

  console.log(`\nAtlas size: ${atlasWidth}x${atlasHeight}`);

  // Create composite operations for sharp
  const composites = [];
  for (const img of images) {
    composites.push({
      input: img.path,
      left: img.x,
      top: img.y,
    });
    console.log(`Packed: ${img.name} at (${img.x}, ${img.y})`);
  }

  // Create the atlas image
  await sharp({
    create: {
      width: atlasWidth,
      height: atlasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(path.join(assetsDir, "zombie.png"));

  console.log("\nCreated: zombie.png");

  // Create the atlas file (must start with empty line before filename)
  const atlasContent = `
zombie.png
size: ${atlasWidth}, ${atlasHeight}
format: RGBA8888
filter: Linear, Linear
repeat: none
${images
  .map(
    (img) => `${img.name}
  rotate: false
  xy: ${img.x}, ${img.y}
  size: ${img.width}, ${img.height}
  orig: ${img.width}, ${img.height}
  offset: 0, 0
  index: -1`
  )
  .join("\n")}
`;

  fs.writeFileSync(path.join(assetsDir, "zombie.atlas"), atlasContent);
  console.log("Created: zombie.atlas");

  console.log("\nZombie atlas created successfully!");
}

main().catch(console.error);
