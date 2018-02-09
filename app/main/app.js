// @flow

import { app } from 'electron';
import devtoolsInstaller from 'electron-devtools-installer';
import { RepositoryManager } from '../common/repository_manager';
import { WindowManager } from '../main/window';
import {
  Config,
  defaultConfig,
} from '../common/bamju_config';


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

async function installExtensions() {
  // const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  // const extensions = [
  //   'REACT_DEVELOPER_TOOLS',
  //   'REDUX_DEVTOOLS'
  // ];
  //
  // Promise.all(extensions.map(async (name) => {
  //   console.log('aa');
  //   const ret = await
  //     devtoolsInstaller(name, forceDownload).then((r) => {
  //       console.log('resolved', r);
  //       return r;
  //     }, (r) => {
  //       console.log('rejected', r);
  //     });
  //   console.log('promise', ret);
  //   return ret;
  // })).catch(console.log);
}
