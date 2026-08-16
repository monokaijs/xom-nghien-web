import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const inputDir = './logos';      // input folder
const outputDir = './output';     // output folder

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const files = fs.readdirSync(inputDir);

for (const file of files) {
  console.log('file', file)

  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(outputDir, file.replace('.png', '.webp'));

  sharp(inputPath)
    .resize({ width: 100 })
    .webp({ quality: 70 })
    .toFile(outputPath)
    .then(() => console.log(`✔ Resized: ${file}`))
    .catch(err => console.error(`❌ Error on ${file}:`, err));
}
