const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', '.next');
const dest = path.resolve(__dirname, '..', 'frontend', '.next');

try {
  if (fs.existsSync(src)) {
    fs.mkdirSync(dest, { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
    console.log(`[sync-next] Successfully synced .next to frontend/.next`);
  }
} catch (err) {
  console.error('[sync-next] Error syncing .next to frontend/.next:', err);
}
