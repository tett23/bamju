// @flow

import {
  BrowserWindow,
} from 'electron';
import {
  type MenuType,
  buildMenu,
  MenuTypeEditor,
} from '../menu';
import {
  Window,
  createWindowID,
} from './window';
import {
  getInstance as getWindowManagerInstance,
} from './window_manager';
import {
  MetaData,
} from './metadata';

export default class EditorWindow implements Window {
  browserWindow: BrowserWindow;
  metaData: MetaData;
  parentWindowID: ?string;
  _windowID: string;
  _menuType: MenuType;

  static create(metaData: MetaData, parentWindowID: ?string) {
    new EditorWindow(metaData, parentWindowID); /* eslint no-new: 0 */
  }

  constructor(metaData: MetaData, parentWindowID: ?string) {
    this.metaData = metaData;
    this.parentWindowID = parentWindowID;
    this._windowID = createWindowID();
    this._menuType = MenuTypeEditor;
    const browserWindow = new BrowserWindow({
      show: false,
      title: `${metaData.internalPath()}`,
    });
    this.browserWindow = browserWindow;

    browserWindow.loadURL(`file://${__dirname}/../editor.html`);

    browserWindow.webContents.on('did-finish-load', () => {
      if (!browserWindow) {
        throw new Error('"browserWindow" is not defined');
      }

      if (process.platform !== 'darwin') {
        const menuItems = buildMenu(MenuTypeEditor, this);
        browserWindow.setMenu(menuItems);
      }

      browserWindow.show();
      browserWindow.focus();

      if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
        browserWindow.toggleDevTools();
      }

      this.initializeRenderer();
    });

    browserWindow.on('focus', () => {
      this.focus();
    });

    browserWindow.on('closed', () => {
      // FIXME: 閉じるダイアログが必要
      this.browserWindow = null;
      getWindowManagerInstance().removeWindow(this.windowID());
    });
  }

  windowID(): string {
    return this._windowID;
  }

  focus() {
    getWindowManagerInstance().focus(this._windowID);
    this.browserWindow.focus();
  }

  getBrowserWindow(): BrowserWindow {
    return this.browserWindow;
  }

  getType(): MenuType {
    return this._menuType;
  }

  async initializeRenderer() {
    const content = await this.metaData.getContent();
    this.browserWindow.webContents.send('initialize', content);
  }

  sendSaveEvent() {
    this.browserWindow.webContents.send('send-buffer-information');
  }
}
