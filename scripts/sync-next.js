const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', '.next');
const dest = path.resolve(__dirname, '..', 'frontend', '.next');

try {
  if (fs.existsSync(src)) {
    fs.mkdirSync(dest, { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
    console.log(`[sync-next] Successfully copied .next from ${src} to ${dest}`);
  } else {
    console.warn(`[sync-next] Source .next not found at ${src}`);
  }
} catch (err) {
  console.error('[sync-next] Error copying .next directory:', err);
}
