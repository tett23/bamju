// @flow

import {
  BrowserWindow,
} from 'electron';
import {
  type MenuType,
  buildMenu,
  MenuTypeApp,
} from '../menu';
import {
  getInstance as getConfigInstance
} from '../common/bamju_config';
import {
  Window,
  type WindowConfig,
} from './window';
import {
  getInstance as getWindowManagerInstance,
} from './window_manager';
import {
  type Buffer,
} from './buffer';

export default class AppWindow implements Window {
  browserWindow: BrowserWindow;
  conf: WindowConfig;
  _menuType: MenuType;

  constructor(conf: WindowConfig) {
    this.conf = conf;
    this._menuType = MenuTypeApp;
    const browserWindow:BrowserWindow = new BrowserWindow({
      show: false,
      x: conf.rectangle.x,
      y: conf.rectangle.y,
      width: conf.rectangle.width,
      height: conf.rectangle.height
    });
    this.browserWindow = browserWindow;

    browserWindow.loadURL(`file://${__dirname}/../app.html`);

    // @TODO: Use 'ready-to-show' event
    //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
    browserWindow.webContents.on('did-finish-load', () => {
      if (!browserWindow) {
        throw new Error('"browserWindow" is not defined');
      }

      getConfigInstance().addWindow(this.conf);

      if (process.platform !== 'darwin') {
        const menuItems = buildMenu(MenuTypeApp, this);
        browserWindow.setMenu(menuItems);
      }

      browserWindow.show();
      browserWindow.focus();

      let { repositoryName, path: itemName } = conf.tabs[0].buffer;
      if (repositoryName === '') {
        repositoryName = 'bamju-specifications';
      }
      if (itemName === '') {
        itemName = 'index.md';
      }
      this.initializeRenderer();
    });

    browserWindow.on('closed', () => {
      getConfigInstance().removeWindow(this.conf.id);
      this.browserWindow = null;
      getWindowManagerInstance().removeWindow(this.windowID());
    });

    browserWindow.on('resize', () => {
      updateRectangle();
    });

    browserWindow.on('move', () => {
      updateRectangle();
    });

    browserWindow.on('focus', () => {
      this.focus();
    });

    const updateRectangle = () => {
      const rectangle = browserWindow.getBounds();
      this.conf.rectangle = {
        x: rectangle.x,
        y: rectangle.y,
        width: rectangle.width,
        height: rectangle.height
      };

      getConfigInstance().replaceWindow(this.conf);
    };
  }

  windowID(): string {
    return this.conf.id;
  }

  focus() {
    getWindowManagerInstance().focus(this.windowID());
    this.browserWindow.focus();
  }

  getBrowserWindow(): BrowserWindow {
    return this.browserWindow;
  }

  getType(): MenuType {
    return this._menuType;
  }

  sendSavedEvent(buffer: Buffer, content: string) {
    this.browserWindow.webContents.send('buffer-updated', buffer, content);
  }

  async initializeRenderer() {
    this.browserWindow.webContents.send('initialize', this.conf);
  }

  async reloadRepositories(repositories: {[string]: Buffer[]}): Promise<void> {
    this.browserWindow.webContents.send('reload-repositories', repositories);
  }
}
