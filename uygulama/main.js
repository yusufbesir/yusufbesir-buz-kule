// description: Buz Kule Electron kabuğu (sertleştirilmiş). sahip: Yusuf; yazan: Claude (Buz Kule iş parçacığı)
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const ANA = path.join(__dirname, 'src', 'index.html');
function createWindow() {
  const win = new BrowserWindow({ width: 960, height: 760, title: 'Buz Kule', backgroundColor: '#000000', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, devTools: false, spellcheck: false } });
  Menu.setApplicationMenu(null);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.session.setPermissionRequestHandler((_wc, _izin, cb) => cb(false));
  win.loadFile(ANA);
}
if (!app.requestSingleInstanceLock()) app.quit(); // tek pencere: iki örnek aynı skor kaydına yazıp birbirini ezmesin
else app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
