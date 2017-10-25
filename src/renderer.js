// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipc} = require('electron');

ipc.sendAsync('open-main-page', '', () => {

});

ipc.sendAsync('open-page');

ipc.on('open-page', () => {
  console.log('open-page', arguments);
});
app
