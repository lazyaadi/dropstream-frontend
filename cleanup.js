import fs from 'fs';

const content = fs.readFileSync('src/App.jsx', 'utf8');
let lines = content.split('\n');

// Remove duplicate fmtTime and fmtFull (start after socket definition)
const cleaned = [];
let skip = false;
for (const line of lines) {
  if (line.includes('// ── HELPERS')) {
    skip = true;
    continue;
  }
  if (skip && line.includes('});') && !line.includes('function')) {
    skip = false;
    cleaned.push(line);
    continue;
  }
  if (!skip) {
    cleaned.push(line);
  }
}

// Remove all comment headers  
let final = cleaned
  .filter(l => !l.match(/^\/\/ ── .* ──/))
  .join('\n')
  .replace(/\n{3,}/g, '\n\n'); // Remove extra blank lines

fs.writeFileSync('src/App.jsx', final, 'utf8');
console.log('✓ Cleaned App.jsx');
