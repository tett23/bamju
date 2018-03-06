// @flow

import { type Store } from 'redux';
import { ipcRenderer, remote, type MenuItem } from 'electron';

import path from '../common/path';
import {
  ItemTypeDirectory,
  ItemTypeRepository,
  ItemTypeUndefined,
  isSimilarFile,
  internalPath,
  type MetaDataID,
  type PathInfo,
} from '../common/metadata';
import {
  type Buffer
} from '../common/buffer';
import * as Message from '../common/message';

import {
  addTab,
} from '../actions/browser';
import {
  newWindow,
  newEditorWindow,
} from '../actions/windows';
import {
  parseMetaData,
} from '../actions/parser';
import {
  removeRepository,
  createFile,
  createDirectory,
  rename,
} from '../actions/repositories';
import {
  search,
} from '../actions/searches';
import {
  openInputDialog,
  openSearchDialog,
} from '../actions/modals';
import {
  addMessage,
} from '../actions/messages';
import {
  type State,
} from '../reducers/app_window';

let _store: Store<State, *>;
export function setStore(store: Store<State, *>) {
  _store = store;
}

export class ContextMenu {
  buffer: ?Buffer;
  linkMetaDataID: ?MetaDataID;
  enableCreateMenu: boolean;
  newFilePathInfo: ?PathInfo;

  constructor(options: {
    buffer?: ?Buffer,
    linkMetaDataID?: MetaDataID,
    enableCreateMenu?: boolean,
    newFilePathInfo?: PathInfo
  }) {
    this.buffer = options.buffer;
    this.linkMetaDataID = options.linkMetaDataID;
    this.enableCreateMenu = options.enableCreateMenu || false;
    this.newFilePathInfo = options.newFilePathInfo;
  }

  show() {
    const menu = remote.require('electron').Menu.buildFromTemplate(this.template());

    menu.popup(remote.getCurrentWindow());
  }

  template(): MenuItem[] {
    const separator = ContextMenu.separator();

    return [
      ContextMenu.wikiLinkUnavailableMenu(this.enableCreateMenu, this.buffer, this.newFilePathInfo),
      ContextMenu.linkMenu(this.linkMetaDataID),
      ContextMenu.openMenu(this.buffer),
      ContextMenu.editMenu(this.buffer),
      ContextMenu.fileMenu(this.buffer),
      ContextMenu.searchMenu(this.buffer),
      ContextMenu.repositoryMenu(this.buffer)
    ].filter(Boolean).reduce((r, items) => {
      return r.concat(items, separator);
    }, []);
  }

  static wikiLinkUnavailableMenu(enabled: boolean, buffer: ?Buffer, newFilePathInfo: ?PathInfo): ?MenuItem[] {
    if (!enabled || buffer == null || newFilePathInfo == null) {
      return null;
    }

    const formValue = internalPath(newFilePathInfo.repositoryName || '', newFilePathInfo.path);

    return ContextMenu.createFileMenu(buffer, formValue);
  }

  static linkMenu(metaDataID: ?MetaDataID): ?MenuItem[] {
    if (metaDataID == null) {
      return null;
    }

    const buffer = _store.getState().global.buffers.find((item) => {
      return item.id === metaDataID;
    });
    if (buffer == null) {
      const message = Message.fail(`ContextMenu.pathMenu MetaData not found. metaDataID=${metaDataID}`);
      _store.dispatch(addMessage(message));
      return null;
    }

    return [].concat(
      ContextMenu.openMenu(buffer),
      ContextMenu.editMenu(buffer),
    );
  }

  static editMenu(buffer: ?Buffer): ?MenuItem[] {
    if (buffer == null) {
      return null;
    }

    return [
      {
        label: 'Edit on system editor',
        click: () => {
          ipcRenderer.send('open-by-system-editor', buffer.absolutePath);
        }
      },
      {
        label: 'Edit on bamju editor',
        click: () => {
          _store.dispatch(newEditorWindow(buffer.id));
        },
        enabled: isSimilarFile(buffer.itemType),
      }
    ];
  }

  static openMenu(buffer: ?Buffer): ?MenuItem[] {
    if (buffer == null) {
      return null;
    }

    return [
      {
        label: 'Open new tab',
        click: () => {
          const tab = addTab(buffer.id, '');
          _store.dispatch(tab);
          _store.dispatch(parseMetaData(tab.payload.id, buffer.id));
        },
        enabled: buffer.itemType !== ItemTypeUndefined
      },
      {
        label: 'Open new window',
        click: () => {
          const rectangle = remote.getCurrentWindow().getBounds();
          rectangle.x += 50;
          rectangle.y += 50;
          _store.dispatch(newWindow(rectangle, [addTab(buffer.id, '').payload]));
        },
        enabled: buffer.itemType !== ItemTypeUndefined
      }
    ];
  }

  static createFileMenu(buffer: Buffer, formValue: string): ? MenuItem[] {
    return [{
      label: 'New File',
      click: () => {
        _store.dispatch(openInputDialog({
          label: 'New File',
          formValue,
          onEnter: (itemPath) => {
            _store.dispatch(createFile(buffer.repositoryName, itemPath));
          }
        }));
      }
    },
    {
      label: 'New File From Template',
      submenu: ContextMenu.templatesMenu(buffer, formValue) || []
    }
    ];
  }

  static fileMenu(buffer: ?Buffer): ?MenuItem[] {
    if (buffer == null) {
      return null;
    }

    const formValue = internalPath(buffer.repositoryName, parentPath(buffer));
    const newFile = ContextMenu.createFileMenu(buffer, formValue) || [];

    return newFile.concat([
      {
        label: 'New Directory',
        click: () => {
          _store.dispatch(openInputDialog({
            label: 'New Directory',
            formValue,
            onEnter: (itemPath) => {
              _store.dispatch(createDirectory(buffer.repositoryName, itemPath));
            }
          }));
        }
      },
      {
        label: 'Rename',
        click: () => {
          _store.dispatch(openInputDialog({
            label: 'Rename',
            formValue: internalPath(buffer.repositoryName, buffer.path),
            onEnter: (itemPath) => {
              _store.dispatch(rename(buffer.id, itemPath));
            }
          }));
        },
        enabled: buffer.itemType === ItemTypeDirectory || isSimilarFile(buffer.itemType)
      },
    ]);
  }

  static repositoryMenu(buffer: ?Buffer): ?MenuItem[] {
    if (buffer == null) {
      return null;
    }

    return [
      {
        label: 'Remove Repository',
        click: () => {
          const { dialog } = remote.require('electron');
          const choice = dialog.showMessageBox(remote.getCurrentWindow(), {
            type: 'question',
            buttons: ['Yes', 'No'],
            title: '削除しますか',
            message: '削除しますか'
          });
          if (choice === 0) {
            _store.dispatch(removeRepository(buffer.absolutePath, buffer.repositoryName));
          }
        },
        enabled: buffer.itemType === ItemTypeRepository
      }
    ];
  }

  static templatesMenu(buffer: ?Buffer, formValue: string): ?MenuItem[] {
    if (buffer == null) {
      return null;
    }

    const buffers = _store.getState().global.buffers;
    const templateBuffer = buffers.find((item) => {
      return item.repositoryName === buffer.repositoryName && item.path === '/templates';
    });
    if (templateBuffer == null) {
      return null;
    }

    const templateBuffers = buffers.filter((item) => {
      return templateBuffer.childrenIDs.includes(item.id);
    });

    return templateBuffers.map((item) => {
      return {
        label: item.name,
        click: () => {
          _store.dispatch(openInputDialog({
            label: 'New File',
            formValue,
            onEnter: (itemPath) => {
              _store.dispatch(createFile(buffer.repositoryName, itemPath, item.id));
            }
          }));
        }
      };
    });
  }

  static searchMenu(buffer: ?Buffer): ?MenuItem[] {
    return [
      {
        label: 'Search',
        click: () => {
          const searchAction = search('', buffer);
          _store.dispatch(searchAction);
          _store.dispatch(openSearchDialog(searchAction.payload.queryID));
        }
      }
    ];
  }

  static separator(): MenuItem[] {
    return [{
      type: 'separator'
    }];
  }
}

function parentPath(buffer: Buffer): string {
  let ret;
  if (buffer.itemType === ItemTypeDirectory) {
    ret = buffer.path;
  } else {
    ret = path.dirname(buffer.path);
  }
  ret = path.join(ret, '/');

  return ret;
}
