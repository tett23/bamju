// @flow

import { type Store } from 'redux';
import { ipcRenderer, remote } from 'electron';

import path from '../common/path';
import {
  ItemTypeDirectory,
  ItemTypeRepository,
  isSimilarFile,
  internalPath,
} from '../common/metadata';
import {
  type Buffer
} from '../common/buffer';

import {
  addTab,
} from '../actions/browser';
import {
  newWindow,
  newEditorWindow,
} from '../actions/windows';
import {
  removeRepository,
  createFile,
  createDirectory,
  rename,
} from '../actions/repositories';
import {
  openInputDialog,
} from '../actions/modals';

let _store: Store<*, *>;
export function setStore(store: Store<*, *>) {
  _store = store;
}

export class ContextMenu {
  buffer: ?Buffer;

  constructor(options: {buffer?: ?Buffer}) {
    this.buffer = options.buffer;
  }

  show() {
    const menu = remote.require('electron').Menu.buildFromTemplate(this.template());

    menu.popup(remote.getCurrentWindow());
  }

  template() {
    return [].concat(
      ContextMenu.openMenu(this.buffer),
      ContextMenu.separator(),
      ContextMenu.editMenu(this.buffer),
      ContextMenu.separator(),
      ContextMenu.fileMenu(this.buffer),
      ContextMenu.separator(),
      ContextMenu.repositoryMenu(this.buffer)
    );
  }

  static editMenu(buffer: ?Buffer) {
    if (buffer == null) {
      return null;
    }

    return [
      {
        label: 'edit on system editor',
        click: () => {
          ipcRenderer.send('open-by-system-editor', buffer.absolutePath);
        }
      },
      {
        label: 'edit on bamju editor',
        click: () => {
          _store.dispatch(newEditorWindow(buffer.id));
        },
        enabled: isSimilarFile(buffer.itemType),
      }
    ];
  }

  static openMenu(buffer: ?Buffer) {
    if (buffer == null) {
      return null;
    }

    return [
      {
        label: 'open new window',
        click: () => {
          const rectangle = remote.getCurrentWindow().getBounds();
          rectangle.x += 50;
          rectangle.y += 50;
          _store.dispatch(newWindow(rectangle, [addTab(buffer.id, '').payload]));
        }
      }
    ];
  }

  static fileMenu(buffer: ?Buffer) {
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

  static repositoryMenu(buffer: ?Buffer) {
    if (buffer == null) {
      return null;
    }

    return [
      {
        label: 'remove',
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

  static separator() {
    return [{
      type: 'separator'
    }];
  }
}
