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
  openInputDialog,
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

  constructor(options: {buffer?: ?Buffer, linkMetaDataID?: MetaDataID}) {
    this.buffer = options.buffer;
    this.linkMetaDataID = options.linkMetaDataID;
  }

  show() {
    const menu = remote.require('electron').Menu.buildFromTemplate(this.template());

    menu.popup(remote.getCurrentWindow());
  }

  template(): MenuItem[] {
    const separator = ContextMenu.separator();

    return [
      ContextMenu.linkMenu(this.linkMetaDataID),
      ContextMenu.openMenu(this.buffer),
      ContextMenu.editMenu(this.buffer),
      ContextMenu.fileMenu(this.buffer),
      ContextMenu.repositoryMenu(this.buffer)
    ].filter(Boolean).reduce((r, items) => {
      return r.concat(items, separator);
    }, []);
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

  static fileMenu(buffer: ?Buffer): ?MenuItem[] {
    if (buffer == null) {
      return null;
    }

    let parentPath;
    if (buffer.itemType === ItemTypeDirectory) {
      parentPath = buffer.path;
    } else {
      parentPath = path.dirname(buffer.path);
    }

    return [
      {
        label: 'New File',
        click: () => {
          _store.dispatch(openInputDialog({
            label: 'New File',
            formValue: internalPath(buffer.repositoryName, parentPath),
            onEnter: (itemPath) => {
              _store.dispatch(createFile(buffer.repositoryName, itemPath));
            }
          }));
        }
      },
      {
        label: 'New Directory',
        click: () => {
          _store.dispatch(openInputDialog({
            label: 'New Directory',
            formValue: internalPath(buffer.repositoryName, parentPath),
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
    ];
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

  static separator(): MenuItem[] {
    return [{
      type: 'separator'
    }];
  }
}
