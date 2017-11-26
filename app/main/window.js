/* eslint no-underscore-dangle: 0, no-param-reassign: 0 */
// @flow

import { ipcMain, BrowserWindow } from 'electron';
import MenuBuilder from '../menu';

const { Config, Window: WindowConfig } = require('../common/bamju_config');

export class WindowManager {
  static create(conf: WindowConfig) {
    const w:Window = new Window(conf);
    _windows.push(w);
  }
}

const _windows:Array<Window> = [];

export class Window {
  browserWindow: BrowserWindow;

  constructor(conf: WindowConfig) {
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
      browserWindow.show();
      browserWindow.focus();

      let { projectName, path: itemName } = conf.tabs[0].buffer;
      if (projectName === null || projectName === undefined) {
        projectName = 'bamju-specifications';
      }
      if (itemName === null || itemName === undefined) {
        itemName = 'index.md';
      }
      this.initializeRenderer(projectName, itemName);
    });

    browserWindow.on('closed', () => {
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

      const r = {
        x: rectangle.x,
        y: rectangle.y,
        width: rectangle.width,
        height: rectangle.height
      };
      const win = Object.assign({}, Config.windows[0]);
      win.rectangle = r;

      Config.update({
        windows: [win]
      });
    };

    const menuBuilder = new MenuBuilder(browserWindow);
    menuBuilder.buildMenu();

    this.browserWindow = browserWindow;
  }

  async initializeRenderer(projectName: string, itemName: string) {
    this.browserWindow.webContents.send('initialize', { projectName, itemName });
  }
}

ipcMain.on('open-new-window', async (e, { projectName, itemName }: {projectName: string, itemName: string}) => {
  console.log('open-new-window', projectName, itemName);

  const conf = Object.assign({}, Config.windows[0]);
  conf.rectangle.x += 50;
  conf.rectangle.y += 50;
  conf.tabs[0].buffer.projectName = projectName;
  conf.tabs[0].buffer.path = itemName;

  WindowManager.create(conf);
});
