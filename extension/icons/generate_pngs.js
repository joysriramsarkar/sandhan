import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const CRC_TABLE = createCRC32Table();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function writePNGChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const toCrc = chunk.subarray(4, 8 + len);
  const crc = crc32(toCrc);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generateSandhanPNG(size) {
  const width = size;
  const height = size;
  // RGBA buffer (height rows, each row has 1 filter byte + width * 4 bytes)
  const rawRowLen = 1 + width * 4;
  const rawData = Buffer.alloc(rawRowLen * height);

  const radius = size * 0.22;
  const pad = size * 0.06;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rawRowLen;
    rawData[rowOffset] = 0; // Filter type None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Calculate distance to rounded rectangle boundary
      const rx = Math.max(pad + radius, Math.min(size - pad - radius, x));
      const ry = Math.max(pad + radius, Math.min(size - pad - radius, y));
      const dist = Math.hypot(x - rx, y - ry);

      if (dist <= radius) {
        // Gradient from #2fbf9a (top-left) to #0e7a63 (mid) to #064034 (bot-right)
        const t = (x + y) / (width + height);
        const r = Math.round(47 * (1 - t) + 6 * t);
        const g = Math.round(191 * (1 - t) + 64 * t);
        const b = Math.round(154 * (1 - t) + 52 * t);

        // Center emblem 'স' pattern approximation (stroke)
        const cx = size / 2;
        const cy = size / 2;
        const dx = x - cx;
        const dy = y - cy;
        const glyphScale = size * 0.28;

        // Draw an elegant central white emblem
        const isEmblem = (
          (Math.abs(dy + size * 0.1) < size * 0.06 && Math.abs(dx) < size * 0.22) || // Top bar
          (Math.abs(dx + size * 0.15) < size * 0.05 && dy > -size * 0.1 && dy < size * 0.15) || // Left leg
          (Math.abs(dx - size * 0.12) < size * 0.05 && dy > -size * 0.1 && dy < size * 0.22) || // Right vertical
          (Math.abs(dy - size * 0.04) < size * 0.05 && dx > -size * 0.15 && dx < size * 0.12) || // Mid cross
          (Math.abs(dy - size * 0.2) < size * 0.05 && Math.abs(dx) < size * 0.18) // Bottom loop
        );

        if (isEmblem) {
          rawData[pixelOffset] = 255;
          rawData[pixelOffset + 1] = 255;
          rawData[pixelOffset + 2] = 255;
          rawData[pixelOffset + 3] = 255;
        } else {
          rawData[pixelOffset] = r;
          rawData[pixelOffset + 1] = g;
          rawData[pixelOffset + 2] = b;
          rawData[pixelOffset + 3] = 255;
        }
      } else {
        // Transparent outside rounded rect
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = writePNGChunk('IHDR', ihdr);
  const idatChunk = writePNGChunk('IDAT', compressed);
  const iendChunk = writePNGChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const sizes = [16, 32, 48, 128];
for (const s of sizes) {
  const buf = generateSandhanPNG(s);
  const target = path.join(__dirname, `icon-${s}.png`);
  fs.writeFileSync(target, buf);
  console.log(`Generated ${target} (${buf.length} bytes)`);
}
