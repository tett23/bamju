/* eslint global-require: 1, flowtype-errors/show-errors: 0 */
// @flow

import { app, BrowserWindow, ipcMain } from 'electron';
import { createStore, applyMiddleware } from 'redux';
import {
  forwardToRenderer,
  triggerAlias,
  replayActionMain,
  createAliasedAction
} from 'electron-redux';
import appReducer from './renderer/reducers/index';
import MenuBuilder from './menu';


const path = require('path');
const fs = require('fs');

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

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728
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

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});

ipcMain.on('open-main-page', (event) => {
  const page = openPage('bamju-specifications', 'index');
  event.sender.send('open-page', page);
  event.returnValue = page;
});

ipcMain.on('refresh-tree-view', (event, project: ?string) => {
  let tree:projects = [];
  if (project != null) {
    tree.push(loadProject(name));
  } else {
    tree = loadProjects();
  }

  event.sender.send('refresh-tree-view', tree);
  event.returnValue = tree;
});

type project = {
  name: string,
  path: string,
  items: projectItems
};
type projects = Array<project>;

type projectItem = {
  name: string,
  path: string
};
type projectItems = Array<projectItem>;

const loadProjects = (): projects => {
  const ret:projects = [];

  console.log('loadProjects', bamjuConfig.projects);
  Object.keys(bamjuConfig.projects).forEach((projectName: string) => {
    ret.push(loadProject(projectName));
  });

  return ret;
};

const loadProject = (projectName: string): project => {
  const projectPath:string = bamjuConfig.projects[projectName];
  if (projectPath === undefined) {
    throw new Error(`loadProject error${projectName}`);
  }

  const ret:project = {
    name: projectName,
    path: projectPath,
    items: loadDirectory(projectPath)
  };
  return ret;
};

const loadDirectory = (projectPath: string): projectItems => {
  const files = fs.readdirSync(projectPath);
  const ret:projectItems = [];
  files.forEach((filename: string) => {
    ret.push({
      name: filename,
      path: path.join(projectPath, filename)
    });
  });

  return ret;
};

type bamjuConfigType = {
  projects: {
    [string]: string
  }
};

const bamjuConfig:bamjuConfigType = {
  projects: {
    'bamju-specifications': '/Users/tett23/projects/bamju-specifications'
  }
};

const openPage = (projectName: string, itemName: string): string => {
  const projectPath:string = bamjuConfig.projects[projectName];
  const fn:string = normalizeName(itemName);
  const abs:string = path.join(projectPath, fn);
  const buf:Buffer = fs.readFileSync(abs);
  const ret:string = buf.toString('UTF-8');

  return ret;
};

// あとで拡張子どうこうする
const normalizeName = (itemName: string): string => `${itemName}.md`;
