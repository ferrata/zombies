const fs = require("fs");
const path = require("path");

// Simple PNG creator using raw bytes (no dependencies)
function createPNG(width, height, r, g, b, a = 255) {
  const png = [];

  // PNG Signature
  png.push(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);

  // IHDR chunk
  const ihdr = [
    (width >> 24) & 0xff,
    (width >> 16) & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    (height >> 24) & 0xff,
    (height >> 16) & 0xff,
    (height >> 8) & 0xff,
    height & 0xff,
    8, // bit depth
    6, // color type (RGBA)
    0, // compression
    0, // filter
    0, // interlace
  ];
  writeChunk(png, "IHDR", ihdr);

  // IDAT chunk (image data)
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      rawData.push(r, g, b, a);
    }
  }

  // Use zlib to compress (Node.js built-in)
  const zlib = require("zlib");
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  writeChunk(png, "IDAT", Array.from(compressed));

  // IEND chunk
  writeChunk(png, "IEND", []);

  return Buffer.from(png);
}

function writeChunk(png, type, data) {
  const length = data.length;
  png.push(
    (length >> 24) & 0xff,
    (length >> 16) & 0xff,
    (length >> 8) & 0xff,
    length & 0xff
  );

  const typeBytes = type.split("").map((c) => c.charCodeAt(0));
  png.push(...typeBytes);
  png.push(...data);

  // CRC
  const crcData = [...typeBytes, ...data];
  const crc = crc32(Buffer.from(crcData));
  png.push(
    (crc >> 24) & 0xff,
    (crc >> 16) & 0xff,
    (crc >> 8) & 0xff,
    crc & 0xff
  );
}

function crc32(buf) {
  let crc = 0xffffffff;
  const table = makeCRCTable();
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeCRCTable() {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

// Create zombie body parts with zombie-green colors
const imagesDir = path.join(__dirname, "../spine/zombie/images");
const assetsDir = path.join(__dirname, "../src/assets/spine");

// Zombie green/gray color palette
const zombieGreen = { r: 0x5a, g: 0x7a, b: 0x5a }; // muted green
const zombieDark = { r: 0x3a, g: 0x4a, b: 0x3a }; // darker green
const zombieRed = { r: 0x8a, g: 0x3a, b: 0x3a }; // blood/wounds

const images = [
  { name: "head", width: 64, height: 64, color: zombieGreen },
  { name: "torso", width: 64, height: 96, color: zombieGreen },
  { name: "arm", width: 48, height: 32, color: zombieGreen },
  { name: "forearm", width: 40, height: 28, color: zombieGreen },
  { name: "hand", width: 24, height: 24, color: zombieDark },
];

// Create images
images.forEach((img) => {
  const png = createPNG(
    img.width,
    img.height,
    img.color.r,
    img.color.g,
    img.color.b
  );
  const filePath = path.join(imagesDir, `${img.name}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Created: ${filePath}`);
});

// Also copy to assets/spine for combined atlas (we'll need it there)
console.log("\nZombie images created successfully!");
console.log(
  "You can now open spine/zombie/zombie.spine in Spine editor to refine the model."
);
