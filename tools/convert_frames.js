const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function naturalSort(files) {
  return files.slice().sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function convertBatch(tasks, concurrency = 12) {
  let index = 0;
  const total = tasks.length;
  let completed = 0;

  async function worker() {
    while (index < total) {
      const current = tasks[index++];
      try {
        await sharp(current.src)
          .resize(current.width, null)
          .webp({ quality: current.quality, effort: 4 })
          .toFile(current.dest);
      } catch (err) {
        console.error(`Error processing ${current.src} -> ${current.dest}:`, err);
        throw err;
      }
      completed++;
      if (completed % 100 === 0 || completed === total) {
        console.log(`Progress: ${completed} / ${total} (${Math.round((completed / total) * 100)}%)`);
      }
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
}

function getFolderStats(dir) {
  const files = fs.readdirSync(dir);
  let totalBytes = 0;
  for (const f of files) {
    totalBytes += fs.statSync(path.join(dir, f)).size;
  }
  const mb = (totalBytes / (1024 * 1024)).toFixed(2);
  return { count: files.length, totalBytes, mb: `${mb} MB` };
}

async function run() {
  console.log('Starting frame preparation...');

  const clip1 = naturalSort(fs.readdirSync('Clip1Frames').filter(f => /\.(jpg|jpeg|png)$/i.test(f)));
  const clip2 = naturalSort(fs.readdirSync('Clip2Frames').filter(f => /\.(jpg|jpeg|png)$/i.test(f)));
  const clip3 = naturalSort(fs.readdirSync('Clip3Frames').filter(f => /\.(jpg|jpeg|png)$/i.test(f)));
  const flow = naturalSort(fs.readdirSync('FlowClipFrames').filter(f => /\.(jpg|jpeg|png)$/i.test(f)));

  // Hero sequence: Clip 1 (all 200), Clip 2 (skip frame 1: 1..199), Clip 3 (skip frame 1: 1..199)
  const heroSrcList = [];
  for (let i = 0; i < clip1.length; i++) {
    heroSrcList.push(path.join('Clip1Frames', clip1[i]));
  }
  // Skip first frame of clip2
  for (let i = 1; i < clip2.length; i++) {
    heroSrcList.push(path.join('Clip2Frames', clip2[i]));
  }
  // Skip first frame of clip3
  for (let i = 1; i < clip3.length; i++) {
    heroSrcList.push(path.join('Clip3Frames', clip3[i]));
  }

  // Dismantle sequence: Flow (all 200)
  const dismantleSrcList = [];
  for (let i = 0; i < flow.length; i++) {
    dismantleSrcList.push(path.join('FlowClipFrames', flow[i]));
  }

  console.log(`Hero total source frames: ${heroSrcList.length}`);
  console.log(`Dismantle total source frames: ${dismantleSrcList.length}`);

  const heroDesktopDir = path.join('assets', 'frames', 'hero');
  const heroMobileDir = path.join('assets', 'frames', 'hero-mobile');
  const dismantleDesktopDir = path.join('assets', 'frames', 'dismantle');
  const dismantleMobileDir = path.join('assets', 'frames', 'dismantle-mobile');

  ensureDir(heroDesktopDir);
  ensureDir(heroMobileDir);
  ensureDir(dismantleDesktopDir);
  ensureDir(dismantleMobileDir);

  const tasks = [];

  // Hero desktop
  heroSrcList.forEach((src, idx) => {
    const filename = `frame_${String(idx + 1).padStart(4, '0')}.webp`;
    tasks.push({
      src,
      dest: path.join(heroDesktopDir, filename),
      width: 1600,
      quality: 78
    });
  });

  // Hero mobile
  heroSrcList.forEach((src, idx) => {
    const filename = `frame_${String(idx + 1).padStart(4, '0')}.webp`;
    tasks.push({
      src,
      dest: path.join(heroMobileDir, filename),
      width: 960,
      quality: 72
    });
  });

  // Dismantle desktop
  dismantleSrcList.forEach((src, idx) => {
    const filename = `frame_${String(idx + 1).padStart(4, '0')}.webp`;
    tasks.push({
      src,
      dest: path.join(dismantleDesktopDir, filename),
      width: 1600,
      quality: 78
    });
  });

  // Dismantle mobile
  dismantleSrcList.forEach((src, idx) => {
    const filename = `frame_${String(idx + 1).padStart(4, '0')}.webp`;
    tasks.push({
      src,
      dest: path.join(dismantleMobileDir, filename),
      width: 960,
      quality: 72
    });
  });

  console.log(`Total conversion tasks: ${tasks.length}`);
  const startTime = Date.now();
  await convertBatch(tasks, 12);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`All conversions completed in ${elapsed}s!`);

  const heroStats = getFolderStats(heroDesktopDir);
  const heroMobileStats = getFolderStats(heroMobileDir);
  const dismantleStats = getFolderStats(dismantleDesktopDir);
  const dismantleMobileStats = getFolderStats(dismantleMobileDir);

  console.log('\n=== FOLDER STATS ===');
  console.log(`assets/frames/hero: ${heroStats.count} frames, ${heroStats.mb}`);
  console.log(`assets/frames/hero-mobile: ${heroMobileStats.count} frames, ${heroMobileStats.mb}`);
  console.log(`assets/frames/dismantle: ${dismantleStats.count} frames, ${dismantleStats.mb}`);
  console.log(`assets/frames/dismantle-mobile: ${dismantleMobileStats.count} frames, ${dismantleMobileStats.mb}`);
}

run().catch(console.error);

