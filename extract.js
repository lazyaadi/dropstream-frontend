import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create components folder
const compFolder = 'src/components/Board';
if (!fs.existsSync(compFolder)) fs.mkdirSync(compFolder, { recursive: true });

const content = fs.readFileSync('src/App.jsx', 'utf8');
const lines = content.split('\n');

function extractFunction(startLine) {
  let braceCount = 0;
  let foundStart = false;
  
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    for (let ch of line) {
      if (ch === '{') { braceCount++; foundStart = true; }
      if (ch === '}') braceCount--;
    }
    if (foundStart && braceCount === 0) {
      return { code: lines.slice(startLine, i + 1).join('\n'), endLine: i };
    }
  }
  return null;
}

const functions = [
  'HistoryPanel', 'SearchBar', 'TypingIndicator', 'OnlineAvatars', 
  'TaskCard', 'Column', 'QuotaBanner', 'PinInput'
];

functions.forEach(funcName => {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('function ' + funcName)) {
      const result = extractFunction(i);
      if (result) {
        const imports = `import React, { useState, useEffect, useRef } from 'react';\nimport { motion, AnimatePresence } from 'framer-motion';\nimport { TD, TL, PRIORITY } from '../../utils/constants';\nimport { LockIcon } from '../UI/Icons';\nimport { fmtTime } from '../../utils/helpers';\n\n`;
        
        const filePath = path.join(compFolder, funcName + '.jsx');
        fs.writeFileSync(filePath, imports + result.code, 'utf8');
        console.log('✓ Extracted', funcName);
      }
      break;
    }
  }
});
