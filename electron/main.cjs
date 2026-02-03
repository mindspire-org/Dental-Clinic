const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow = null;
let backendProcess = null;

const isDev = !app.isPackaged;

const logPath = () => {
  try {
    return path.join(app.getPath('userData'), 'desktop.log');
  } catch {
    return path.join(process.cwd(), 'desktop.log');
  }
};

const logLine = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logPath(), line, { encoding: 'utf8' });
  } catch {
    // ignore
  }
};

const showFatal = (title, error) => {
  const message = error?.message ? String(error.message) : String(error);
  logLine(`${title}: ${message}`);
  try {
    dialog.showErrorBox(title, `${message}\n\nLog: ${logPath()}`);
  } catch {
    // ignore
  }
};

process.on('uncaughtException', (err) => {
  showFatal('Desktop App Error (uncaughtException)', err);
});

process.on('unhandledRejection', (err) => {
  showFatal('Desktop App Error (unhandledRejection)', err);
});

const getStartUrl = () => {
  if (isDev) return process.env.ELECTRON_START_URL || 'http://localhost:8080';
  return `file://${path.join(__dirname, '..', 'dist', 'index.html')}`;
};

const waitForHttpOk = (url, timeoutMs = 30000) => {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        const ok = res.statusCode && res.statusCode >= 200 && res.statusCode < 500;
        res.resume();
        if (ok) return resolve();
        if (Date.now() > deadline) return reject(new Error(`Timeout waiting for ${url}`));
        setTimeout(attempt, 500);
      });

      req.on('error', () => {
        if (Date.now() > deadline) return reject(new Error(`Timeout waiting for ${url}`));
        setTimeout(attempt, 500);
      });
    };

    attempt();
  });
};

const startBackendIfPackaged = async () => {
  if (isDev) return;

  const backendDir = path.join(process.resourcesPath, 'backend');
  const serverPath = path.join(backendDir, 'server.js');

  logLine(`Packaged backendDir=${backendDir}`);
  logLine(`Packaged serverPath=${serverPath}`);

  if (!fs.existsSync(serverPath)) {
    throw new Error(`Backend server.js not found at: ${serverPath}`);
  }

  backendProcess = spawn(process.execPath, [serverPath], {
    cwd: backendDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: 'production',
      PORT: process.env.PORT || '5000',
    },
    stdio: 'inherit',
  });

  const exitedEarly = new Promise((_, reject) => {
    backendProcess.once('exit', (code) => {
      if (code && code !== 0) reject(new Error(`Backend exited with code ${code}`));
    });
  });

  backendProcess.on('exit', (code) => {
    backendProcess = null;
    if (code && code !== 0) {
      // Backend crashed; keep window but API will fail.
    }
  });

  await Promise.race([
    waitForHttpOk('http://localhost:5000/health', 45000),
    exitedEarly,
  ]);
};

const createWindow = async () => {
  const iconPath = isDev
    ? path.join(__dirname, '..', 'public', 'dental-logo.png')
    : path.join(__dirname, '..', 'dist', 'dental-logo.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    showFatal('Failed to load UI', new Error(`${errorCode} ${errorDescription} (${validatedURL})`));
    try {
      if (mainWindow && !mainWindow.isVisible()) mainWindow.show();
    } catch {
      // ignore
    }
  });

  const startUrl = getStartUrl();
  logLine(`Loading URL: ${startUrl}`);
  if (isDev) {
    await mainWindow.loadURL(startUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  if (!isDev) {
    startBackendIfPackaged().catch((e) => showFatal('Backend failed to start', e));
  }

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) return;
    mainWindow.show();
  });

  setTimeout(() => {
    try {
      if (mainWindow && !mainWindow.isVisible()) mainWindow.show();
    } catch {
      // ignore
    }
  }, 4000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => createWindow().catch((e) => showFatal('Failed to create window', e)));
