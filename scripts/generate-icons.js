const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function createSvg(size) {
  const r = size * 0.22;
  const strokeW = size * 0.015;
  const padding = size * 0.18;
  const scale = (size * 0.64) / 100;
  const glow = size * 0.03;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${glow}" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bgGrad)" />
  <rect x="${size * 0.03}" y="${size * 0.03}" width="${size * 0.94}" height="${size * 0.94}" rx="${r * 0.9}" fill="none" stroke="#27272a" stroke-width="${strokeW}" />
  <g transform="translate(${padding}, ${padding}) scale(${scale})" filter="url(#glow)">
    <circle cx="50" cy="50" r="46" fill="none" stroke="url(#glowGrad)" stroke-width="6" opacity="0.3" />
    <path d="M18 58 L34 58 L46 30 L56 70 L66 44 L74 58 L82 58" fill="none" stroke="url(#glowGrad)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="46" cy="30" r="5" fill="#10b981" />
    <circle cx="66" cy="44" r="4.5" fill="#06b6d4" />
  </g>
</svg>`;
}

fs.writeFileSync(path.join(dir, 'icon-192x192.svg'), createSvg(192));
fs.writeFileSync(path.join(dir, 'icon-512x512.svg'), createSvg(512));
fs.writeFileSync(path.join(dir, 'icon.svg'), createSvg(512));
console.log('App icons generated in public/icons');
