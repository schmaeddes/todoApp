const { applyLinuxSafeArgv } = require('./linux-safe.cjs');

applyLinuxSafeArgv();

import('./main.js').catch((error) => {
  console.error('Failed to start Todo app:', error);
  process.exit(1);
});
