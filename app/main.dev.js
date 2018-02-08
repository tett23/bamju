/* eslint global-require: 0, flowtype-errors/show-errors: 0 */
// @flow

import path from 'path';
import { app } from 'electron';
import { RepositoryManager } from './common/repository_manager';
import { WindowManager } from './main/window';

const { Config, defaultConfig } = require('./common/bamju_config');
require('./main/window');
require('./main/project');

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];

  return Promise
    .all(extensions.map(name => { return installer.default(installer[name], forceDownload); }))
    .catch(console.log);
};


/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('ready', async () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }
  console.log('event app ready');

  await Config.init();

  const repositoryManager = new RepositoryManager(Config.bufferItems, Config.repositories);
  repositoryManager.loadRepositories();

  WindowManager.loadWindows(Config.windows);
});

app.on('before-quit', () => {
  Config.quit();
});

app.on('activate', async () => {
  if (WindowManager.getWindows().length === 0) {
    WindowManager.createAppWindow(defaultConfig.windows[0]);
  }
});
