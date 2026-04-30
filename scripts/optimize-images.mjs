#!/usr/bin/env node
/**
 * Image optimization script: generates WebP + AVIF siblings for every PNG/JPG
 * under src/assets/. Skips files that already have an up-to-date sibling.
 *
 * Run: npm run optimize:images
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', 'src', 'assets');
const PUBLIC_ROOT = path.resolve(__dirname, '..', 'public');

const TARGET_EXTS = new Set(['.png', '.jpg', '.jpeg']);
const WEBP_QUALITY = 82;
const AVIF_QUALITY = 55;

let processed = 0;
let skipped = 0;
let savedBytes = 0;

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function isSiblingFresh(srcPath, siblingPath) {
  try {
    const [src, sibling] = await Promise.all([fs.stat(srcPath), fs.stat(siblingPath)]);
    return sibling.mtimeMs >= src.mtimeMs;
  } catch {
    return false;
  }
}

async function convert(srcPath) {
  const ext = path.extname(srcPath).toLowerCase();
  if (!TARGET_EXTS.has(ext)) return;

  const base = srcPath.slice(0, -ext.length);
  const webpPath = `${base}.webp`;
  const avifPath = `${base}.avif`;

  const srcStat = await fs.stat(srcPath);
  const tasks = [];

  if (!(await isSiblingFresh(srcPath, webpPath))) {
    tasks.push(
      sharp(srcPath)
        .webp({ quality: WEBP_QUALITY, effort: 5 })
        .toFile(webpPath)
        .then((info) => {
          savedBytes += Math.max(0, srcStat.size - info.size);
        })
    );
  }
  if (!(await isSiblingFresh(srcPath, avifPath))) {
    tasks.push(
      sharp(srcPath)
        .avif({ quality: AVIF_QUALITY, effort: 4 })
        .toFile(avifPath)
        .catch((err) => {
          // AVIF can fail for tiny / unusual images; non-fatal.
          console.warn(`  ! AVIF skipped for ${path.relative(ROOT, srcPath)}: ${err.message}`);
        })
    );
  }

  if (tasks.length === 0) {
    skipped++;
    return;
  }

  await Promise.all(tasks);
  processed++;
  console.log(`  ✓ ${path.relative(ROOT, srcPath)}`);
}

async function processRoot(rootDir, label) {
  console.log(`\n→ Scanning ${label} (${rootDir})`);
  for await (const file of walk(rootDir)) {
    await convert(file);
  }
}

async function main() {
  const start = Date.now();
  console.log('Image optimization starting…');

  await processRoot(ROOT, 'src/assets');
  await processRoot(PUBLIC_ROOT, 'public');

  const seconds = ((Date.now() - start) / 1000).toFixed(1);
  const savedMb = (savedBytes / (1024 * 1024)).toFixed(2);
  console.log(
    `\nDone in ${seconds}s — converted ${processed} file(s), skipped ${skipped} fresh siblings, saved ~${savedMb} MB on WebP output.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
