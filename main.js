const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const createWindow = ()=>{
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    })
    win.loadFile('index.html');
    win.webContents.openDevTools();
    if (!fs.existsSync('./audio')) fs.mkdirSync('./audio');
    if (!fs.existsSync('./input')) fs.mkdirSync('./input');
    if (!fs.existsSync('./results')) fs.mkdirSync('./results');
    if (!fs.existsSync('./segments')) fs.mkdirSync('./segments');
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');
    if (!fs.existsSync('./tmp/tmp')) fs.mkdirSync('./tmp/tmp');
}
app.whenReady().then(createWindow)
app.on('window-all-closed', () => {if (process.platform !== 'darwin') app.quit()});
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow()});