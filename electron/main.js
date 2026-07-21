import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const linuxSafe = process.env.ELECTRON_LINUX_SAFE === '1';

if (linuxSafe) {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.commandLine.appendSwitch('disable-gpu');

  const electronTmp = path.join(app.getPath('userData'), 'tmp');
  fs.mkdirSync(electronTmp, { recursive: true });
  app.setPath('temp', electronTmp);
  process.env.TMPDIR = electronTmp;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;
const useDevServer = isDev && process.env.ELECTRON_USE_DIST !== '1';
const DEV_SERVER_URL = 'http://localhost:5173';
const INDEX_HTML = path.join(app.getAppPath(), 'dist', 'index.html');
const ICON_PATH = path.join(__dirname, '../build/icon.png');

let storage = null;

async function initStorage() {
  process.env.DATA_DIR =
    process.env.DATA_DIR || path.join(app.getPath('userData'), 'data');

  const paths = await import('../server/paths.js');
  await paths.ensureDataDir();

  const todos = await import('../server/todos.js');
  const config = await import('../server/config.js');

  storage = {
    readTodos: todos.readTodos,
    writeTodos: todos.writeTodos,
    readProjects: todos.readProjects,
    writeProjects: todos.writeProjects,
    readSettings: config.readSettings,
    writeSettings: config.writeSettings,
    getDataDir: paths.getDataDir,
  };
}

function registerIpcHandlers() {
  ipcMain.handle('todos:fetch', () => storage.readTodos());
  ipcMain.handle('todos:save', (_event, todos) => storage.writeTodos(todos));
  ipcMain.handle('projects:fetch', () => storage.readProjects());
  ipcMain.handle('projects:save', (_event, projects) =>
    storage.writeProjects(projects),
  );
  ipcMain.handle('settings:fetch', () => storage.readSettings());
  ipcMain.handle('settings:save', (_event, settings) =>
    storage.writeSettings(settings),
  );
  ipcMain.handle('app:getDataDir', () => storage.getDataDir());
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function loadDevUrl(window, url, attempts = 60) {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await window.loadURL(url);
      return;
    } catch (error) {
      lastError = error;
      await sleep(500);
    }
  }

  throw lastError;
}

function shouldOpenDevTools() {
  if (!isDev || !useDevServer) {
    return false;
  }

  if (process.env.ELECTRON_DEVTOOLS === '1') {
    return true;
  }

  if (process.env.ELECTRON_DEVTOOLS === '0') {
    return false;
  }

  return !linuxSafe;
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    icon: ICON_PATH,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  window.webContents.on('preload-error', (_event, preloadPath, error) => {
    console.error(`Preload failed (${preloadPath}):`, error);
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  if (useDevServer) {
    await loadDevUrl(window, DEV_SERVER_URL);
  } else {
    await window.loadFile(INDEX_HTML);
  }

  if (shouldOpenDevTools()) {
    window.webContents.openDevTools();
  }

  return window;
}

app.whenReady().then(async () => {
  try {
    Menu.setApplicationMenu(null);
    await initStorage();
    registerIpcHandlers();
    await createWindow();
  } catch (error) {
    console.error('Failed to start Todo app:', error);
    app.quit();
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
