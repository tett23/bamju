// @flow

import { Menu } from 'electron';
import {
  buildMenu,
  type MenuType,
  MenuTypeInit,
} from '../menu';
import {
  type Window as WindowConfig,
} from '../reducers/windows';
import {
  type MetaDataID,
} from './metadata';
import {
  Window,
  type WindowID,
} from './window';
import AppWindow from './app_window';
import EditorWindow from './editor_window';

let _instance: WindowManager;

export function getInstance() {
  return _instance;
}

export class WindowManager {
  _appWindows: Array<AppWindow>;
  _editorWindows: Array<EditorWindow>;

  constructor(config: WindowConfig[]) {
    _instance = this;

    this._appWindows = [];
    this._editorWindows = [];

    config.forEach((c) => {
      this.createAppWindow(c);
    });

    const currentWindow = this._appWindows[0];
    if (currentWindow != null) {
      currentWindow.focus();
    }

    if (process.platform === 'darwin') {
      const menuItems = buildMenu(MenuTypeInit, null);
      Menu.setApplicationMenu(menuItems);
    }
  }

  createAppWindow(conf: WindowConfig) {
    const w:AppWindow = new AppWindow(conf);

    this._appWindows.push(w);
  }

  createEditorWindow(windowID: WindowID, metaDataID: MetaDataID) {
    let bounds;
    if (this._editorWindows.length === 0) {
      if (this._appWindows.length === 0) {
        bounds = {
          x: 100,
          y: 100,
          width: 1024,
          height: 728
        };
      } else {
        bounds = this._appWindows[this._appWindows.length - 1].getBrowserWindow().getBounds();
      }
    } else {
      bounds = this._editorWindows[this._editorWindows.length - 1].getBrowserWindow().getBounds();
    }
    bounds.x += 50;
    bounds.y += 50;

    const w = EditorWindow.create(windowID, metaDataID, bounds);

    this._editorWindows.push(w);
  }

  loadWindows(config: Array<WindowConfig>) {
    config.forEach((c) => {
      this.createAppWindow(c);
    });

    const currentWindow = this._appWindows[0];
    if (currentWindow != null) {
      currentWindow.focus();
    }
  }

  removeWindow(windowID: string): boolean {
    let idx = this._appWindows.findIndex((w) => {
      return w.windowID() === windowID;
    });
    if (idx !== -1) {
      // if (this._appWindows[idx].browserWindow != null) {
      //   this._appWindows[idx].browserWindow.close();
      // }
      this._appWindows.splice(idx);
      return true;
    }

    idx = this._editorWindows.findIndex((w) => {
      return w.windowID() === windowID;
    });
    if (idx !== -1) {
      // if (this._editorWindows[idx].browserWindow != null) {
      //   this._editorWindows[idx].browserWindow.close();
      // }
      this._editorWindows.splice(idx);
      return true;
    }

    return false;
  }

  sendSaveEventAll() {
    this._editorWindows.forEach((w) => {
      w.sendSaveEvent();
    });
  }

  sendSaveEvent(windowID: string) {
    const window = this._editorWindows.find((w) => {
      return w.windowID() === windowID;
    });

    if (window) {
      window.sendSaveEvent();
    }
  }

  focus(windowID: string): boolean {
    const window: ?Window = this._findWindow(windowID);
    if (window != null && process.platform === 'darwin') {
      this._updateMenu(window);
    }

    return false;
  }

  findAppWindow(windowID: WindowID): ?AppWindow {
    return this._appWindows.find((w) => {
      return w.windowID() === windowID;
    });
  }

  _updateMenu(window: Window) { /* eslint class-methods-use-this: 0 */
    const menuType: MenuType = window.getType();

    const newMenu = buildMenu(menuType, window);
    Menu.setApplicationMenu(newMenu);
  }

  _findWindow(windowID: string): ?Window {
    let window:?Window;
    window = this.findAppWindow(windowID);
    if (window) {
      return window;
    }

    window = this._editorWindows.find((w) => {
      return w.windowID() === windowID;
    });
    if (window) {
      return window;
    }

    return null;
  }

  getAppWindows(): Array<AppWindow> {
    return this._appWindows;
  }

  getEditorWindow(metaDataID: MetaDataID): ?EditorWindow {
    return this._editorWindows.find((w) => {
      return w.metaDataID === metaDataID;
    });
  }
}

export default WindowManager;
