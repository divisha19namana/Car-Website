const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function naturalSort(files) {
  return files.slice().sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });
}

async function compareImages(fileA, fileB) {
  const bufA = await sharp(fileA).raw().toBuffer();
  const bufB = await sharp(fileB).raw().toBuffer();
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff += Math.abs(bufA[i] - bufB[i]);
  }
  const avgDiff = diff / bufA.length;
  return avgDiff; // average pixel difference per byte
}

async function main() {
  const clip1 = naturalSort(fs.readdirSync('Clip1Frames').filter(f => /\.(jpg|jpeg|png)$/i.test(f)));
  const clip2 = naturalSort(fs.readdirSync('Clip2Frames').filter(f => /\.(jpg|jpeg|png)$/i.test(f)));
  const clip3 = naturalSort(fs.readdirSync('Clip3Frames').filter(f => /\.(jpg|jpeg|png)$/i.test(f)));
  const flow = naturalSort(fs.readdirSync('FlowClipFrames').filter(f => /\.(jpg|jpeg|png)$/i.test(f)));

  console.log(`Clip1: ${clip1.length} files (first: ${clip1[0]}, last: ${clip1[clip1.length-1]})`);
  console.log(`Clip2: ${clip2.length} files (first: ${clip2[0]}, last: ${clip2[clip2.length-1]})`);
  console.log(`Clip3: ${clip3.length} files (first: ${clip3[0]}, last: ${clip3[clip3.length-1]})`);
  console.log(`Flow/Dismantle: ${flow.length} files (first: ${flow[0]}, last: ${flow[flow.length-1]})`);

  const diff1_2 = await compareImages(
    path.join('Clip1Frames', clip1[clip1.length - 1]),
    path.join('Clip2Frames', clip2[0])
  );
  console.log(`Avg diff between Clip1 last and Clip2 first: ${diff1_2}`);

  const diff2_3 = await compareImages(
    path.join('Clip2Frames', clip2[clip2.length - 1]),
    path.join('Clip3Frames', clip3[0])
  );
  console.log(`Avg diff between Clip2 last and Clip3 first: ${diff2_3}`);

  // Also check metadata of first frame
  const meta = await sharp(path.join('Clip1Frames', clip1[0])).metadata();
  console.log('Sample image metadata:', meta.width, 'x', meta.height, meta.format);
}

main().catch(console.error);

