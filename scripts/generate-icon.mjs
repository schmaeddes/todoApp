import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const svgPath = path.join(rootDir, 'build', 'icon.svg');
const pngPath = path.join(rootDir, 'build', 'icon.png');

const svg = fs.readFileSync(svgPath);

await sharp(svg).resize(1024, 1024).png().toFile(pngPath);

console.log(`Wrote ${pngPath}`);
