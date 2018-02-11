// @flow

import { app } from 'electron';
import expandHomeDir from 'expand-home-dir';
import {
  RepositoryManager
} from '../common/repository_manager';
import {
  WindowManager,
  getInstance as getWindowManagerInstance,
} from '../common/window_manager';
import {
  BamjuConfig,
  defaultConfig,
} from '../common/bamju_config';


let p:string = '~/.config/bamju/config.json';
if (process.platform === 'windows') {
  p = '~\\AppData\\Local\\bamju\\config.json';
}
const configPath:string = expandHomeDir(p);

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

let config;

app.on('ready', async () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }
  console.log('event app ready');

  config = new BamjuConfig(configPath);
  const conf = config.getConfig();

  const repositoryManager = new RepositoryManager(conf.bufferItems, conf.repositories);
  await repositoryManager.loadRepositories();

  const _ = new WindowManager(conf.windows);
});

app.on('before-quit', async () => {
  // TODO: configからWindowManagerを参照しないようにしたい
  await config.quit();
});

app.on('activate', async () => {
  if (getWindowManagerInstance().getAppWindows().length === 0) {
    getWindowManagerInstance().createAppWindow(defaultConfig.windows[0]);
  }
});

async function installExtensions() {
  const installer = require('electron-devtools-installer'); // eslint-disable-line
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];

  return Promise
    .all(extensions.map(name => { return installer.default(installer[name], forceDownload); }))
    .catch(console.log);
}
