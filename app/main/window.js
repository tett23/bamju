/* eslint no-underscore-dangle: 0, no-param-reassign: 0 */
// @flow

import { ipcMain, BrowserWindow } from 'electron';
import MenuBuilder from '../menu';

const {
  Config, Window: WindowConfig, addWindowConfig, removeWindowConfig, replaceWindowConfig
} = require('../common/bamju_config');

export class WindowManager {
  static create(conf: WindowConfig) {
    const w:Window = new Window(conf);
    _windows.push(w);
  }

  static getWindows(): Array<Window> {
    return _windows;
  }
}

const _windows:Array<Window> = [];

export class Window {
  browserWindow: BrowserWindow;
  conf: WindowConfig;

  constructor(conf: WindowConfig) {
    this.conf = conf;
    const browserWindow:BrowserWindow = new BrowserWindow({
      show: false,
      x: conf.rectangle.x,
      y: conf.rectangle.y,
      width: conf.rectangle.width,
      height: conf.rectangle.height
    });

    browserWindow.loadURL(`file://${__dirname}/../app.html`);

    // @TODO: Use 'ready-to-show' event
    //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
    browserWindow.webContents.on('did-finish-load', () => {
      if (!browserWindow) {
        throw new Error('"browserWindow" is not defined');
      }

      addWindowConfig(this.conf);

      browserWindow.show();
      browserWindow.focus();

      let { projectName, path: itemName } = conf.tabs[0].buffer;
      if (projectName === '') {
        projectName = 'bamju-specifications';
      }
      if (itemName === '') {
        itemName = 'index.md';
      }
      this.initializeRenderer();
    });

    browserWindow.on('closed', () => {
      removeWindowConfig(this.conf.id);
      this.browserWindow = null;
    });

    browserWindow.on('resize', () => {
      updateRectangle();
    });

    browserWindow.on('move', () => {
      updateRectangle();
    });

    const updateRectangle = () => {
      const rectangle = browserWindow.getBounds();
      this.conf.rectangle = {
        x: rectangle.x,
        y: rectangle.y,
        width: rectangle.width,
        height: rectangle.height
      };

      replaceWindowConfig(this.conf);
    };

    const menuBuilder = new MenuBuilder(browserWindow);
    menuBuilder.buildMenu();

    this.browserWindow = browserWindow;
  }

  async initializeRenderer() {
    this.browserWindow.webContents.send('initialize', this.conf);
  }
}

ipcMain.on('open-new-window', async (e, { projectName, itemName }: {projectName: string, itemName: string}) => {
  console.log('open-new-window', projectName, itemName);

  const conf = Object.assign({}, Config.windows[0]);
  conf.id = createWindowID();
  conf.rectangle.x += 50;
  conf.rectangle.y += 50;
  conf.tabs = [{
    buffer: {
      projectName,
      path: itemName
    }
  }];

  WindowManager.create(conf);
});

function createWindowID(): string {
  const timestamp:number = new Date().getTime();

  return `${timestamp}${Math.random()}`;
}
