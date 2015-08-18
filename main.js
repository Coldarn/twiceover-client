'use strict';

const app = require('app');
const path = require('path');

if (process.argv.indexOf('--squirrel-install') >= 0 || process.argv.indexOf( '--squirrel-updated') >= 0) {
    // Register the twiceover:// protocol with Windows
    const regPath = path.join(__dirname, 'install.reg');
    const fs = require('fs');
    const escapedExePath = process.argv[0].replace(/\\/g, '\\\\');
    fs.writeFileSync(regPath, fs.readFileSync(regPath).toString().replace('##REPLACEME##', escapedExePath));
    require('child_process').execSync(`regedit.exe -s "${regPath}"`);
    app.quit();
} else if (process.argv.indexOf('--squirrel-uninstall') >= 0 || process.argv.indexOf( '--squirrel-obsolete') >= 0) {
    // Remove protocol registration
    require('child_process').execSync(`regedit.exe -s "${path.join(__dirname, 'uninstall.reg')}"`);
    app.quit();
}


var BrowserWindow = require('browser-window');  // Module to create native browser window.

// Report crashes to our server.
require('crash-reporter').start();

const ipc = require('ipc');
ipc.on('get-review', function (event) {
    const lastArg = process.argv[process.argv.length - 1];
    event.returnValue = lastArg && lastArg.toLowerCase().startsWith('twiceover://') ? lastArg : null;
});
ipc.on('reload-window', function (event) {
    event.sender.reloadIgnoringCache();
});
ipc.on('show-dev-tools', function (event) {
    event.sender.openDevTools({ detach: true });
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 700,
        "auto-hide-menu-bar": true
    });

    // and load the index.html of the app.
    mainWindow.loadUrl('file://' + __dirname + '/app/index.html');

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
});
