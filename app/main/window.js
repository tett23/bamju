/* eslint no-underscore-dangle: 0, no-param-reassign: 0, class-methods-use-this: 0 */
// @flow

import {
  ipcMain,
  BrowserWindow,
  Menu
} from 'electron';
import {
  buildMenu,
  type MenuType,
  MenuTypeInit,
  MenuTypeApp,
  MenuTypeEditor
} from '../menu';
import {
  RepositoryManager,
  getInstance,
} from '../common/repository_manager';
import {
  MetaData,
  internalPath,
} from '../common/metadata';
import {
  type Buffer,
} from '../common/buffer';
import {
  MessageTypeSucceeded,
  MessageTypeFailed,
} from '../common/util';

const {
  Config, Window: WindowConfig, findWindowConfig, addWindowConfig, removeWindowConfig, replaceWindowConfig
} = require('../common/bamju_config');

const _appWindows:Array<AppWindow> = [];
const _editorWindows: Array<EditorWindow> = [];

export interface Window {
  windowID(): string;
  focus(): void;
  getBrowserWindow(): BrowserWindow;
  getType(): MenuType
}

export class WindowManager {
  static init() {
    if (process.platform === 'darwin') {
      const menuItems = buildMenu(MenuTypeInit, null);
      Menu.setApplicationMenu(menuItems);
    }
  }

  static createAppWindow(conf: WindowConfig) {
    const w:AppWindow = new AppWindow(conf);

    _appWindows.push(w);
  }

  static createEditorWindow(metaData: MetaData, parentWindowID: ?string) {
    const w = new EditorWindow(metaData, parentWindowID);

    _editorWindows.push(w);
  }

  static loadWindows(config: Array<WindowConfig>) {
    config.forEach((c) => {
      WindowManager.createAppWindow(c);
    });

    const currentWindow = _appWindows[0];
    if (currentWindow != null) {
      currentWindow.focus();
    }
  }

  static removeWindow(windowID: string): boolean {
    let idx = _appWindows.findIndex((w) => {
      return w.windowID() === windowID;
    });
    if (idx !== -1) {
      _appWindows.splice(idx);
      return true;
    }

    idx = _editorWindows.findIndex((w) => {
      return w.windowID() === windowID;
    });
    if (idx !== -1) {
      _editorWindows.splice(idx);
      return true;
    }

    return false;
  }

  static sendSaveEventAll() {
    _editorWindows.forEach((w) => {
      w.sendSaveEvent();
    });
  }

  static sendSaveEvent(windowID: string) {
    const window = _editorWindows.find((w) => {
      return w.windowID() === windowID;
    });

    if (window) {
      window.sendSaveEvent();
    }
  }

  static sendSavedEventAll(buffer: Buffer) {
    _appWindows.forEach((w) => {
      w.sendSavedEvent(buffer);
    });
  }

  static focus(windowID: string): boolean {
    const window: ?Window = WindowManager._findWindow(windowID);
    if (window != null && process.platform === 'darwin') {
      WindowManager._updateMenu(window);
    }

    return false;
  }

  static _updateMenu(window: Window) {
    const menuType: MenuType = window.getType();

    const newMenu = buildMenu(menuType, window);
    Menu.setApplicationMenu(newMenu);
  }

  static _findWindow(windowID: string): ?Window {
    let window:?Window;
    window = _appWindows.find((w) => {
      return w.windowID() === windowID;
    });
    if (window) {
      return window;
    }

    window = _editorWindows.find((w) => {
      return w.windowID() === windowID;
    });
    if (window) {
      return window;
    }

    return null;
  }

  static getWindows(): Array<AppWindow> {
    return _appWindows;
  }

  static getEditorWindow(projectName: string, itemPath: string): ?EditorWindow {
    return _editorWindows.find((w) => {
      return w.metaData.projectName === projectName && w.metaData.path === itemPath;
    });
  }

  static async updateTreeView(tv: MetaData[]): Promise<void> {
    const p: Array<Promise<void>> = _appWindows.map(async (item: AppWindow): Promise<void> => {
      console.log('Manager updateTreeView before updateTreeView await');
      await item.updateTreeView(tv);
      console.log('Manager updateTreeView after updateTreeView await');
    });
    console.log('Manager updateTreeView create promise array');

    console.log('Manager updateTreeView before Promise.all');
    await Promise.all(p);
    console.log('Manager updateTreeView after Promise.all');
  }
}

export class AppWindow implements Window {
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

      if (process.platform !== 'darwin') {
        const menuItems = buildMenu(MenuTypeApp, this);
        browserWindow.setMenu(menuItems);
      }

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
      WindowManager.removeWindow(this.windowID());
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

      replaceWindowConfig(this.conf);
    };

    this.browserWindow = browserWindow;
  }

  windowID(): string {
    return this.conf.id;
  }

  focus() {
    WindowManager.focus(this.windowID());
    this.browserWindow.focus();
  }

  getBrowserWindow(): BrowserWindow {
    return this.browserWindow;
  }

  getType(): MenuType {
    return MenuTypeApp;
  }

  sendSavedEvent(buffer: Buffer) {
    this.browserWindow.webContents.send('buffer-updated', buffer);
  }

  async initializeRenderer() {
    this.browserWindow.webContents.send('initialize', this.conf);
  }

  async updateTreeView(tv: MetaData[]): Promise<void> {
    this.browserWindow.webContents.send('refresh-tree-view', tv);
  }
}

export class EditorWindow implements Window {
  browserWindow: BrowserWindow;
  metaData: MetaData;
  parentWindowID: ?string;
  _windowID: string;

  static create(metaData: MetaData, parentWindowID: ?string) {
    new EditorWindow(metaData, parentWindowID); /* eslint no-new: 0 */
  }

  constructor(metaData: MetaData, parentWindowID: ?string) {
    this.metaData = metaData;
    this.parentWindowID = parentWindowID;
    this._windowID = createWindowID();
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
      WindowManager.removeWindow(this.windowID());
    });
  }

  windowID(): string {
    return this._windowID;
  }

  focus() {
    WindowManager.focus(this._windowID);
    this.browserWindow.focus();
  }

  getBrowserWindow(): BrowserWindow {
    return this.browserWindow;
  }

  getType(): MenuType {
    return MenuTypeEditor;
  }

  async initializeRenderer() {
    const content = await this.metaData.getContent();
    this.browserWindow.webContents.send('initialize', content);
  }

  sendSaveEvent() {
    this.browserWindow.webContents.send('send-buffer-information');
  }
}

ipcMain.on('open-new-window', async (e, { windowID, projectName, itemName }: {windowID: string, projectName: string, itemName: string}) => {
  console.log('open-new-window', projectName, itemName);

  let conf:?WindowConfig = findWindowConfig(windowID);
  if (conf === null || conf === undefined) {
    conf = Object.assign({}, Config.windows[0]);
  }

  conf.id = createWindowID();
  conf.rectangle.x += 50;
  conf.rectangle.y += 50;
  conf.tabs = [{
    buffer: {
      projectName,
      path: itemName
    }
  }];

  WindowManager.createAppWindow(conf);
});

ipcMain.on('open-by-bamju-editor', async (e, fileInfo: {parentWindowID: ?string, projectName: string, itemName: string}) => {
  console.log('open-by-bamju-editor', fileInfo);

  const metaData = getInstance().detect(fileInfo.projectName, fileInfo.itemName);
  if (metaData == null) {
    e.send('show-information', {
      type: 'error',
      message: `file not found. projectName${internalPath(fileInfo.projectName, fileInfo.itemName)}`
    });

    return;
  }

  const editorWindow = WindowManager.getEditorWindow(fileInfo.projectName, fileInfo.itemName);
  if (editorWindow == null) {
    WindowManager.createEditorWindow(metaData, fileInfo.parentWindowID);
  } else {
    editorWindow.focus();
  }
});

ipcMain.on('save-buffer', async (e, { buffer, content }: {buffer: Buffer, content: string}) => {
  console.log('save-buffer', buffer);

  const repo = getInstance().find(buffer.repositoryName);
  if (repo == null) {
    const mes = {
      type: MessageTypeFailed,
      message: 'save-buffer error',
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const metaData = repo.getItemByPath(buffer.path);
  if (metaData == null) {
    const mes = {
      type: MessageTypeFailed,
      message: 'save-buffer error',
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const message = await metaData.updateContent(content);
  if (message.type !== MessageTypeSucceeded) {
    const mes = {
      type: MessageTypeFailed,
      message: `save-buffer error: ${message.message}`,
    };
    e.sender.send('message', mes);
    e.returnValue = null;
  }

  e.sender.send('buffer-saved', message);
  e.returnValue = message;

  const [parseResult, parseMesage] = await metaData.parse();
  if (parseResult == null || parseMesage !== MessageTypeSucceeded) {
    const mes = {
      type: MessageTypeFailed,
      message: `save-buffer error: ${parseMesage.message}`,
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  WindowManager.sendSavedEventAll(parseResult.content);
});

function createWindowID(): string {
  const timestamp:number = new Date().getTime();

  return `${timestamp}${Math.random()}`;
}
