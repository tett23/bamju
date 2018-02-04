// @flow
import { app, Menu, shell, BrowserWindow } from 'electron';

export const MenuTypeInit = 'init';
export const MenuTypeApp = 'app';
export const MenuTypeEditor = 'editor';
export type MenuType = 'init' | 'app' | 'editor';

export class MenuBuilder {
  _mainWindow: BrowserWindow;
  _menuType: MenuType;

  constructor(menuType: MenuType, mainWindow: BrowserWindow) {
    this._mainWindow = mainWindow;
    this._menuType = menuType;
  }

  buildMenu() {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
      this.setupDevelopmentEnvironment();
    }

    let template;

    if (process.platform === 'darwin') {
      template = this.buildDarwinTemplate();
    } else {
      template = this.buildDefaultTemplate();
    }

    const menu = Menu.buildFromTemplate(template);
    if (process.platform === 'darwin') {
      Menu.setApplicationMenu(menu);
    } else {
      this._mainWindow.setMenu(menu);
    }

    return menu;
  }

  updateMenu(menuType: MenuType, mainWindow: BrowserWindow) {
    this._mainWindow = mainWindow;
    this._menuType = menuType;
  }

  setupDevelopmentEnvironment() {
    this._mainWindow.openDevTools();
    this._mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu
        .buildFromTemplate([{
          label: 'Inspect element',
          click: () => {
            this._mainWindow.inspectElement(x, y);
          }
        }])
        .popup(this._mainWindow);
    });
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: 'Electron',
      submenu: [
        { label: 'About ElectronReact', selector: 'orderFrontStandardAboutPanel:' },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide ElectronReact', accelerator: 'Command+H', selector: 'hide:' },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', selector: 'hideOtherApplications:' },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Command+Q', click: () => { app.quit(); } }
      ]
    };
    const subMenuEdit = {
      label: 'Edit',
      submenu: [
        {
          label: 'Open...',
          accelerator: 'Command+O',
          click: () => {
          },
          enabled: false,
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'Command+S',
          click: () => {
          },
          enabled: false,
        },
        {
          label: 'Save As...',
          accelerator: 'Command+Shift+S',
          click: () => {
          },
          enabled: false,
        },
        {
          label: 'Save All...',
          accelerator: 'Command+Alt+S',
          click: () => {
          },
          enabled: false,
        },
        { type: 'separator' },
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'Command+A', selector: 'selectAll:' }
      ]
    };
    const subMenuViewDev = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => { this._mainWindow.webContents.reload(); }
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => { this._mainWindow.setFullScreen(!this._mainWindow.isFullScreen()); }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => { this._mainWindow.toggleDevTools(); }
        }
      ]
    };
    const subMenuViewProd = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => { this._mainWindow.webContents.reload(); }
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => { this._mainWindow.setFullScreen(!this._mainWindow.isFullScreen()); }
        }
      ]
    };
    const subMenuWindow = {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'Command+M', selector: 'performMiniaturize:' },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' }
      ]
    };
    const subMenuHelp = {
      label: 'Help',
      submenu: [
        { label: 'Learn More', click() { shell.openExternal('http://electron.atom.io'); } },
        { label: 'Documentation', click() { shell.openExternal('https://github.com/atom/electron/tree/master/docs#readme'); } },
        { label: 'Community Discussions', click() { shell.openExternal('https://discuss.atom.io/c/electron'); } },
        { label: 'Search Issues', click() { shell.openExternal('https://github.com/atom/electron/issues'); } }
      ]
    };

    const subMenuView = process.env.NODE_ENV === 'development'
      ? subMenuViewDev
      : subMenuViewProd;

    return [
      subMenuAbout,
      subMenuEdit,
      subMenuView,
      subMenuWindow,
      subMenuHelp
    ];
  }

  buildDefaultTemplate() {
    const templateDefault = [{
      label: '&File',
      submenu: [
        {
          label: '&Open',
          enabled: false,
          accelerator: 'Ctrl+O'
        },
        {
          label: '&Save',
          accelerator: 'Ctrl+S',
          enabled: false,
          onclick: () => {

          }
        },
        {
          label: '&Close',
          accelerator: 'Ctrl+W',
          click: () => {
            this._mainWindow.close();
          }
        }
      ]
    }, {
      label: '&View',
      submenu: (process.env.NODE_ENV === 'development') ? [{
        label: '&Reload',
        accelerator: 'Ctrl+R',
        click: () => {
          this._mainWindow.webContents.reload();
        }
      }, {
        label: 'Toggle &Full Screen',
        accelerator: 'F11',
        click: () => {
          this._mainWindow.setFullScreen(!this._mainWindow.isFullScreen());
        }
      }, {
        label: 'Toggle &Developer Tools',
        accelerator: 'Alt+Ctrl+I',
        click: () => {
          this._mainWindow.toggleDevTools();
        }
      }] : [{
        label: 'Toggle &Full Screen',
        accelerator: 'F11',
        click: () => {
          this._mainWindow.setFullScreen(!this._mainWindow.isFullScreen());
        }
      }]
    }, {
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
    }];

    return templateDefault;
  }
}

export default MenuBuilder;
