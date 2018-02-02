// @flow
import { app, Menu, shell } from 'electron';
import { EditorWindow } from './main/window';

export default class MenuBuilder {
  mainWindow: EditorWindow;

  constructor(mainWindow: EditorWindow) {
    this.mainWindow.browserWindow = mainWindow;
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
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.browserWindow.openDevTools();
    this.mainWindow.browserWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu
        .buildFromTemplate([{
          label: 'Inspect element',
          click: () => {
            this.mainWindow.browserWindow.inspectElement(x, y);
          }
        }])
        .popup(this.mainWindow.browserWindow);
    });
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: 'Bamju',
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
          label: 'Save',
          accelerator: 'Command+S',
          click: () => {
            this.mainWindow.sendSaveEvent();
          }
        },
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
        { label: 'Reload', accelerator: 'Command+R', click: () => { this.mainWindow.browserWindow.webContents.reload(); } },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => { this.mainWindow.browserWindow.setFullScreen(!this.mainWindow.browserWindow.isFullScreen()); }
        },
        { label: 'Toggle Developer Tools', accelerator: 'Alt+Command+I', click: () => { this.mainWindow.browserWindow.toggleDevTools(); } }
      ]
    };
    const subMenuViewProd = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => { this.mainWindow.browserWindow.setFullScreen(!this.mainWindow.browserWindow.isFullScreen()); }
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
      submenu: [{
        label: '&Save',
        accelerator: 'Ctrl+S',
        click: () => {
          this.mainWindow.sendSaveEvent();
        }
      }, {
        label: '&Open',
        accelerator: 'Ctrl+O'
      }, {
        label: '&Close',
        accelerator: 'Ctrl+W',
        click: () => {
          this.mainWindow.browserWindow.close();
        }
      }]
    }, {
      label: '&View',
      submenu: (process.env.NODE_ENV === 'development') ? [{
        label: '&Reload',
        accelerator: 'Ctrl+R',
        click: () => {
          this.mainWindow.browserWindow.webContents.reload();
        }
      }, {
        label: 'Toggle &Full Screen',
        accelerator: 'F11',
        click: () => {
          this.mainWindow.browserWindow.setFullScreen(!this.mainWindow.browserWindow.isFullScreen());
        }
      }, {
        label: 'Toggle &Developer Tools',
        accelerator: 'Alt+Ctrl+I',
        click: () => {
          this.mainWindow.browserWindow.toggleDevTools();
        }
      }] : [{
        label: 'Toggle &Full Screen',
        accelerator: 'F11',
        click: () => {
          this.mainWindow.browserWindow.setFullScreen(!this.mainWindow.browserWindow.isFullScreen());
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
