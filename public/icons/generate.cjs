// Script pour générer les icônes PNG depuis un SVG inline
// Usage : node generate.cjs
// Nécessite : npm install canvas (optionnel — sinon utilise le SVG directement)

const fs = require("fs");
const path = require("path");

// SVG de l'icône CinéRadar (bobine + couleur rouge)
const svgTemplate = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Fond rouge arrondi -->
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#e63946"/>
  <!-- Bobine de film -->
  <rect x="${size*0.15}" y="${size*0.28}" width="${size*0.70}" height="${size*0.44}" rx="${size*0.07}" fill="none" stroke="white" stroke-width="${size*0.07}"/>
  <circle cx="${size*0.34}" cy="${size*0.50}" r="${size*0.09}" fill="none" stroke="white" stroke-width="${size*0.06}"/>
  <circle cx="${size*0.66}" cy="${size*0.50}" r="${size*0.09}" fill="none" stroke="white" stroke-width="${size*0.06}"/>
  <line x1="${size*0.43}" y1="${size*0.50}" x2="${size*0.57}" y2="${size*0.50}" stroke="white" stroke-width="${size*0.05}"/>
  <line x1="${size*0.34}" y1="${size*0.28}" x2="${size*0.34}" y2="${size*0.20}" stroke="white" stroke-width="${size*0.05}"/>
  <line x1="${size*0.66}" y1="${size*0.28}" x2="${size*0.66}" y2="${size*0.20}" stroke="white" stroke-width="${size*0.05}"/>
  <line x1="${size*0.34}" y1="${size*0.72}" x2="${size*0.34}" y2="${size*0.80}" stroke="white" stroke-width="${size*0.05}"/>
  <line x1="${size*0.66}" y1="${size*0.72}" x2="${size*0.66}" y2="${size*0.80}" stroke="white" stroke-width="${size*0.05}"/>
</svg>`;

const outDir = __dirname;
const sizes = [192, 512];

for (const size of sizes) {
  const svg = svgTemplate(size);
  const outPath = path.join(outDir, `icon-${size}.svg`);
  fs.writeFileSync(outPath, svg, "utf8");
  console.log(`✓ Écrit : icon-${size}.svg`);
}

console.log("\nConvertissez ces SVG en PNG (ex: avec Inkscape, SVGR, ou sharp) :");
console.log("  npx sharp-cli -i icon-192.svg -o icon-192.png");
console.log("  npx sharp-cli -i icon-512.svg -o icon-512.png");
