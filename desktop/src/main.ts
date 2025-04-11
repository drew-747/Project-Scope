import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import Store from 'electron-store';

const store = new Store();

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // In development, load from localhost
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built React app
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // Handle window state
  const windowState = store.get('windowState', {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined,
  }) as WindowState;

  mainWindow.setSize(windowState.width, windowState.height);
  if (windowState.x !== undefined && windowState.y !== undefined) {
    mainWindow.setPosition(windowState.x, windowState.y);
  }

  mainWindow.on('close', () => {
    const { width, height } = mainWindow.getBounds();
    const [x, y] = mainWindow.getPosition();
    store.set('windowState', { width, height, x, y });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle secure storage
ipcMain.handle('secure-store-get', async (event, key: string) => {
  return store.get(key);
});

ipcMain.handle('secure-store-set', async (event, key: string, value: any) => {
  store.set(key, value);
});

// Handle deep linking
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('securechat', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('securechat');
}

// Handle protocol links (securechat://)
app.on('open-url', (event, url) => {
  event.preventDefault();
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (mainWindow) {
    mainWindow.webContents.send('deep-link', url);
  }
}); 