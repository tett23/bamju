// @flow
// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer } = require('electron');


// ipc.sendAsync('open-page');

ipcRenderer.on('open-page', (event, arg) => {
  console.log('open-page', arg);
});

ipcRenderer.send('open-main-page', '', () => {
  console.log('hogehoge');
});
