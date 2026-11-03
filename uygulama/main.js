// description: Buz Kule (Icy Tower'dan esinlenen özgün klon) Electron kabuğu. sahip: Claude (Icy Tower iş parçacığı)
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
function createWindow() {
  const win = new BrowserWindow({ width: 960, height: 760, title: 'Buz Kule', backgroundColor: '#000000', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
