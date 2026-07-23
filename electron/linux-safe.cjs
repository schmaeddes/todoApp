function shouldUseLinuxSafeMode() {
  if (process.platform !== 'linux') {
    return false;
  }

  return process.env.ELECTRON_LINUX_SAFE === '1' || !process.defaultApp;
}

function applyLinuxSafeArgv() {
  if (!shouldUseLinuxSafeMode()) {
    return;
  }

  for (const arg of ['--no-sandbox', '--disable-dev-shm-usage']) {
    if (!process.argv.includes(arg)) {
      process.argv.push(arg);
    }
  }
}

module.exports = {
  shouldUseLinuxSafeMode,
  applyLinuxSafeArgv,
};
