/* eslint no-underscore-dangle: 0, no-param-reassign: 0, class-methods-use-this: 0 */
// @flow

import { ipcMain, BrowserWindow } from 'electron';
import {
  MenuBuilder,
  type MenuType,
  MenuTypeApp,
  MenuTypeEditor
} from '../menu';
import {
  Manager as ProjectManager,
  internalPath,
  ProjectItem,
  type ProjectItems
} from '../common/project';

const {
  Config, Window: WindowConfig, findWindowConfig, addWindowConfig, removeWindowConfig, replaceWindowConfig
} = require('../common/bamju_config');

const _appWindows:Array<AppWindow> = [];
const _editorWindows: Array<EditorWindow> = [];

interface Window {
  windowID(): string;
  focus(): void;
  getBrowserWindow(): BrowserWindow;
  getType(): MenuType
}

export class WindowManager {
  static _menu; // darwinのみで使用される

  static init() {
    const menuBuilder = new MenuBuilder(null);
    WindowManager._menu = menuBuilder.buildMenu();
  }

  static createAppWindow(conf: WindowConfig) {
    const w:AppWindow = new AppWindow(conf);

    ProjectManager.loadProjects(() => {
      WindowManager.updateTreeView(ProjectManager.projects());
    });

    _appWindows.push(w);
  }

  static createEditorWindow(projectItem: ProjectItem, parentWindowID: ?string) {
    const w = new EditorWindow(projectItem, parentWindowID);

    _editorWindows.push(w);
  }

  static loadWindows(config: Array<WindowConfig>) {
    config.forEach((c) => {
      WindowManager.createAppWindow(c);
    });

    const currentWindow = _appWindows[0];
    currentWindow.focus();
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

    WindowManager._menu.updateMenu(menuType, window.getBrowserWindow());
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

  static async updateTreeView(tv: ProjectItems): Promise<void> {
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
        const menuBuilder = new MenuBuilder(browserWindow);
        menuBuilder.buildMenu();
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

  async initializeRenderer() {
    this.browserWindow.webContents.send('initialize', this.conf);
  }

  async updateTreeView(tv: ProjectItems): Promise<void> {
    this.browserWindow.webContents.send('refresh-tree-view', tv);
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

  const projectItem = ProjectManager.detect(fileInfo.projectName, fileInfo.itemName);
  if (projectItem == null) {
    e.send('show-information', {
      type: 'error',
      message: `file not found. projectName${internalPath(fileInfo.projectName, fileInfo.itemName)}`
    });

    return;
  }

  WindowManager.createEditorWindow(projectItem, fileInfo.parentWindowID);
});

export class EditorWindow implements Window {
  browserWindow: BrowserWindow;
  projectItem: ProjectItem;
  parentWindowID: ?string;
  _windowID: string;

  static create(projectItem: ProjectItem, parentWindowID: ?string) {
    new EditorWindow(projectItem, parentWindowID); /* eslint no-new: 0 */
  }

  constructor(projectItem: ProjectItem, parentWindowID: ?string) {
    this.projectItem = projectItem;
    this.parentWindowID = parentWindowID;
    this._windowID = createWindowID();
    const browserWindow = new BrowserWindow({
      show: false,
      title: `${projectItem.internalPath()}`,
    });
    this.browserWindow = browserWindow;

    browserWindow.loadURL(`file://${__dirname}/../editor.html`);

    browserWindow.webContents.on('did-finish-load', () => {
      if (!browserWindow) {
        throw new Error('"browserWindow" is not defined');
      }

      if (process.platform !== 'darwin') {
        const menuBuilder = new MenuBuilder(browserWindow);
        menuBuilder.buildMenu();
      }

      browserWindow.show();
      browserWindow.focus();

      if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
        browserWindow.toggleDevTools();
      }

      this.initializeRenderer();
    });

    browserWindow.on('focus', () => {
    // FIXME: ふたつのmenuを運用するか、ひとつにまとめるか決めないといけない
      // const menuBuilder = new EditorMenuBuilder(this);
      // menuBuilder.buildMenu();
      this.focus();
    });

    browserWindow.on('closed', () => {
      // FIXME: 閉じるダイアログが必要
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
    const buffer = await this.projectItem.toRawBuffer();
    this.browserWindow.webContents.send('initialize', buffer);
  }

  sendSaveEvent() {
    this.browserWindow.webContents.send('collect-save-information', {});
  }
}

function createWindowID(): string {
  const timestamp:number = new Date().getTime();

  return `${timestamp}${Math.random()}`;
}
