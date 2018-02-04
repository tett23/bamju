// @flow
import {
  app,
  Menu,
  MenuItem,
  shell,
  BrowserWindow
} from 'electron';

import {
  WindowManager
} from './main/window';

export const MenuTypeInit = 'init';
export const MenuTypeApp = 'app';
export const MenuTypeEditor = 'editor';
export type MenuType = 'init' | 'app' | 'editor';

export const PlatformTypeDarwin = 'darwin';
export const PlatformTypeDefault = 'default';
export type PlatformType = 'darwin' | 'default';
export const platformType = process.platform === 'darwin' ? PlatformTypeDarwin : PlatformTypeDefault;

export function buildMenu(menuType: MenuType, browserWindow: ?BrowserWindow): Menu {
  if (menuType !== MenuTypeInit && browserWindow == null) {
    throw (new Error(''));
  }

  let menuItems:Array<MenuItem>;
  if (menuType === MenuTypeInit) {
    menuItems = initMenu();
  } else if (process.platform === 'darwin') {
    menuItems = buildDarwin(menuType, browserWindow);
  } else {
    menuItems = buildDefault(menuType, browserWindow);
  }


  const ret = new Menu();
  menuItems.forEach((item) => {
    ret.append(item);
  });

  return ret;
}

function initMenu(): Array<MenuItem> {
  const ret:Array<MenuItem> = [];
  if (platformType === PlatformTypeDarwin) {
    ret.push(subMenuAbout());
  }

  ret.push(subMenuHelp());

  return ret;
}

function buildDarwin(menuType: MenuType, browserWindow: BrowserWindow): Array<MenuItem> {
  const ret:Array<MenuItem> = [];
  ret.push(subMenuAbout());
  ret.push(subMenuFile(browserWindow));
  ret.push(subMenuEdit(menuType, browserWindow));
  ret.push(subMenuView(browserWindow));
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    ret.push(subMenuDebug(browserWindow));
  }
  ret.push(subMenuWindow(browserWindow));
  ret.push(subMenuHelp());

  return ret;
}

function buildDefault(menuType: MenuType, browserWindow: BrowserWindow): Array<MenuItem> {
  const ret:Array<MenuItem> = [];

  ret.push(subMenuFile(browserWindow));
  ret.push(subMenuEdit(menuType, browserWindow));
  ret.push(subMenuView(browserWindow));
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    ret.push(subMenuDebug(browserWindow));
  }
  ret.push(subMenuHelp());

  return ret;
}

function subMenuAbout(): MenuItem {
  const template = {
    label: 'Electron',
    submenu: [
      { label: 'About ElectronReact', selector: 'orderFrontStandardAboutPanel:' },
      { type: 'separator' },
      { label: 'Services', submenu: [] },
      { type: 'separator' },
      { label: 'Hide ElectronReact', accelerator: 'CmdOrCtrl+H', selector: 'hide:' },
      { label: 'Hide Others', accelerator: 'CmdOrCtrl+Shift+H', selector: 'hideOtherApplications:' },
      { label: 'Show All', selector: 'unhideAllApplications:' },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => { app.quit(); } }
    ]
  };

  return new MenuItem(template);
}

function subMenuWindow(_: BrowserWindow): MenuItem {
  const template = {
    label: 'Window',
    submenu: [
      { label: 'Minimize', accelerator: 'CmdOrCtrl+M', selector: 'performMiniaturize:' },
      { type: 'separator' },
      { label: 'Bring All to Front', selector: 'arrangeInFront:' }
    ]
  };

  return new MenuItem(template);
}

function subMenuFile(browserWindow: BrowserWindow): MenuItem {
  const template = {
    label: 'File',
    submenu: [
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        click: () => {
          browserWindow.close();
        }
      },
      { label: 'Close All', accelerator: 'CmdOrCtrl+Shift+W', selector: 'performClose:' },
    ]
  };

  return new MenuItem(template);
}

function subMenuEdit(menuType: MenuType, browserWindow: BrowserWindow): MenuItem {
  const isEnableEditorMenu = menuType === MenuTypeEditor;

  const template = {
    label: 'Edit',
    submenu: [
      {
        label: 'Open...',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
        },
        enabled: isEnableEditorMenu,
      },
      { type: 'separator' },
      {
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        click: () => {
          browserWindow.webContents.send('send-buffer-information');
        },
        enabled: isEnableEditorMenu,
      },
      {
        label: 'Save As...',
        accelerator: 'CmdOrCtrl+Shift+S',
        click: () => {
        },
        enabled: isEnableEditorMenu,
      },
      {
        label: 'Save All...',
        accelerator: 'CmdOrCtrl+Alt+S',
        click: () => {
          console.log('save all');
          WindowManager.sendSaveEventAll();
        },
        enabled: isEnableEditorMenu,
      },
      { type: 'separator' },
      { role: 'undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
      { role: 'redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
      { type: 'separator' },
      { role: 'cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
      { role: 'copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
      { role: 'paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
      { role: 'selectall', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
    ]
  };

  return new MenuItem(template);
}

function subMenuView(browserWindow: BrowserWindow): MenuItem {
  const toggleFullScreenKey = platformType === PlatformTypeDarwin ? 'Ctrl+Command+F' : 'F11';

  const template = {
    label: 'View',
    submenu: [
      {
        label: 'Toggle Full Screen',
        role: 'togglefullscreen',
        accelerator: toggleFullScreenKey,
        click: () => {
          browserWindow.setFullScreen(!browserWindow.isFullScreen());
        }
      },
    ]
  };

  return new MenuItem(template);
}

function subMenuDebug(browserWindow: BrowserWindow): MenuItem {
  const template = {
    label: 'Debug',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => { browserWindow.webContents.reload(); }
      },
      {
        role: 'toggledevtools',
        accelerator: 'Alt+CmdOrCtrl+I',
        click: () => {
          browserWindow.toggleDevTools();
        }
      }
    ]
  };

  return new MenuItem(template);
}

function subMenuHelp(): MenuItem {
  const template = {
    label: 'Help',
    submenu: [{
      label: 'Learn More',
      click() {
        shell.openExternal('http://electron.atom.io');
      }
    }, {
      label: 'Documentation',
      click() {
        shell.openExternal('https://github.com/atom/electron/tree/master/docs#readme');
      }
    }, {
      label: 'Community Discussions',
      click() {
        shell.openExternal('https://discuss.atom.io/c/electron');
      }
    }, {
      label: 'Search Issues',
      click() {
        shell.openExternal('https://github.com/atom/electron/issues');
      }
    }]
  };

  return new MenuItem(template);
}
