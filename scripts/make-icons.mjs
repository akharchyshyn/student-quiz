import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('public/icons', { recursive: true });
const svg = (s) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">
     <rect width="100%" height="100%" rx="${s * 0.18}" fill="#0d6efd"/>
     <text x="50%" y="55%" font-size="${s * 0.5}" text-anchor="middle"
       dominant-baseline="middle" fill="#fff" font-family="sans-serif">?</text>
   </svg>`,
);
for (const s of [192, 512]) {
  await sharp(svg(s)).png().toFile(`public/icons/icon-${s}.png`);
}
console.log('icons generated');
