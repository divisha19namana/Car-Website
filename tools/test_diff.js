const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function compareImages(fileA, fileB) {
  const bufA = await sharp(fileA).raw().toBuffer();
  const bufB = await sharp(fileB).raw().toBuffer();
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff += Math.abs(bufA[i] - bufB[i]);
  }
  return diff / bufA.length;
}

async function test() {
  console.log('Clip1[199] vs Clip1[198]:', await compareImages('Clip1Frames/ezgif-frame-200.jpg', 'Clip1Frames/ezgif-frame-199.jpg'));
  console.log('Clip1[199] vs Clip2[0]:', await compareImages('Clip1Frames/ezgif-frame-200.jpg', 'Clip2Frames/ezgif-frame-001.jpg'));
  console.log('Clip1[199] vs Clip2[1]:', await compareImages('Clip1Frames/ezgif-frame-200.jpg', 'Clip2Frames/ezgif-frame-002.jpg'));
  console.log('Clip2[199] vs Clip2[198]:', await compareImages('Clip2Frames/ezgif-frame-200.jpg', 'Clip2Frames/ezgif-frame-199.jpg'));
  console.log('Clip2[199] vs Clip3[0]:', await compareImages('Clip2Frames/ezgif-frame-200.jpg', 'Clip3Frames/ezgif-frame-001.jpg'));
  console.log('Clip2[199] vs Clip3[1]:', await compareImages('Clip2Frames/ezgif-frame-200.jpg', 'Clip3Frames/ezgif-frame-002.jpg'));
}
test();

