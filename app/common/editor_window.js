// @flow

import {
  BrowserWindow,
  Bounds,
} from 'electron';
import {
  type MenuType,
  buildMenu,
  MenuTypeEditor,
} from '../menu';
import {
  type WindowID,
  Window,
} from './window';
import {
  getInstance as getWindowManagerInstance,
} from './window_manager';
import {
  getInstance as getRepositoryManagerInstance,
} from './repository_manager';
import {
  type MetaDataID,
} from './metadata';
import * as Message from './message';
import {
  addMessage,
} from '../actions/messages';
import {
  dispatch,
} from '../main/event_dispatcher';

export default class EditorWindow implements Window {
  browserWindow: BrowserWindow;
  metaDataID: MetaDataID;
  _windowID: string;
  _menuType: MenuType;

  static create(windowID: WindowID, metaData: MetaDataID, bounds: Bounds) {
    return new EditorWindow(windowID, metaData, bounds);
  }

  constructor(windowID: WindowID, metaDataID: MetaDataID, bounds: Bounds) {
    this.metaDataID = metaDataID;
    this._windowID = windowID;
    this._menuType = MenuTypeEditor;
    const metaData = getRepositoryManagerInstance().getItemByID(metaDataID);
    if (metaData == null) {
      throw Error(`EditorWindow.constructor getItemByID error metaDataID=${metaDataID}`);
    }
    const browserWindow = new BrowserWindow({
      show: false,
      title: `${metaData.internalPath()}`,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
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
    const metaData = getRepositoryManagerInstance().getItemByID(this.metaDataID);
    if (metaData == null) {
      dispatch(addMessage({
        type: Message.MessageTypeFailed,
        message: `EditorWindow.initializeRenderer error metaDataID=${this.metaDataID}`
      }, { targetWindowID: this.windowID() }));
      return;
    }
    const [content, _, message] = await metaData.getContent();

    if (Message.isSimilarError(message)) {
      dispatch(addMessage(Message.wrap(message), { targetWindowID: this.windowID() }));
      return;
    }

    this.browserWindow.webContents.send('initialize', [metaData.toBuffer(), content]);
  }

  sendSaveEvent() {
    this.browserWindow.webContents.send('send-buffer-information');
  }
}
