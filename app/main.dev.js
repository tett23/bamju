/* eslint global-require: 1, flowtype-errors/show-errors: 0 */
// @flow

import path from 'path';
import { app, BrowserWindow } from 'electron';
import { createStore, applyMiddleware } from 'redux';
import {
  forwardToRenderer,
  triggerAlias,
  replayActionMain
} from 'electron-redux';
import appReducer from './renderer/reducers/index';
import MenuBuilder from './menu';
import Config from './common/bamju_config';


const store = createStore(
  appReducer,
  undefined, // optional
  applyMiddleware(
    triggerAlias, // optional, see below
    forwardToRenderer, // IMPORTANT! This goes last
  )
);

replayActionMain(store);

let mainWindow = null;

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
    .all(extensions.map(name => installer.default(installer[name], forceDownload)))
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

  await Config.init();

  console.log('ready', Config);
  mainWindow = new BrowserWindow({
    show: false,
    x: Config.windows[0].x,
    y: Config.windows[0].y,
    width: Config.windows[0].width,
    height: Config.windows[0].height
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('resize', () => {
    updateRectangle();
  });

  mainWindow.on('move', () => {
    updateRectangle();
  });

  const updateRectangle = () => {
    const rectangle = mainWindow.getBounds();

    Config.update({
      windows: [{
        x: rectangle.x,
        y: rectangle.y,
        width: rectangle.width,
        height: rectangle.height
      }]
    });
  };

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});

require('./main/project');
