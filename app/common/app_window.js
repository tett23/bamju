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
  dispatch,
} from '../main/event_dispatcher';
import {
  type Window as WindowConfig,
  updateWindowRectangle,
  closeWindow,
} from '../actions/windows';
import {
  Window,
} from './window';
import {
  getInstance as getWindowManagerInstance,
} from './window_manager';
import {
  type MetaDataID,
} from './metadata';
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

      if (process.platform !== 'darwin') {
        const menuItems = buildMenu(MenuTypeApp, this);
        browserWindow.setMenu(menuItems);
      }

      browserWindow.show();
      browserWindow.focus();

      this.initializeRenderer();
    });

    browserWindow.on('closed', () => {
      dispatch(closeWindow(this.conf.id));
      this.browserWindow = null;
      getWindowManagerInstance().removeWindow(this.windowID());
      dispatch(closeWindow(this.conf.id));
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
      dispatch(updateWindowRectangle(this.conf.id, rectangle));
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

  sendSavedEvent(metaDataID: MetaDataID, content: string) {
    this.browserWindow.webContents.send('buffer-content-updated', [metaDataID, content]);
  }

  async initializeRenderer() {
    this.browserWindow.webContents.send('initialize', this.conf);
  }

  async reloadRepositories(buffers: Buffer[]): Promise<void> {
    this.browserWindow.webContents.send('reload-buffers', buffers);
  }
}
