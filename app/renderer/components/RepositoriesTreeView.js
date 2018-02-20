// @flow

import { ipcRenderer, remote } from 'electron';
import * as React from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import {
  type Rectangle,
  type Tab,
  newWindow,
  addTab,
} from '../../actions/windows';
import {
  addRepository,
  removeRepository,
} from '../../actions/repositories';
import type { State } from '../../reducers/app_window';
import {
  type Buffer
} from '../../common/buffer';
import {
  type MetaDataID,
  type ItemType,
  ItemTypeMarkdown,
  ItemTypeText,
  ItemTypeDirectory,
  ItemTypeRepository,
  ItemTypeCSV,
  ItemTypeTSV,
  ItemTypeHTML,
  ItemTypeUndefined,
  isSimilarFile,
  isSimilarDirectory,
} from '../../common/metadata';
import {
  type WindowID,
} from '../../common/window';
import styles from './RepositoriesTreeView.css';

type Props = {
  buffers: Buffer[],
  newWindow: typeof newWindow,
  addTab: typeof addTab,
  addRepository: typeof addRepository,
  removeRepository: typeof removeRepository
};

const defaultProps = {
  buffers: [],
  newWindow: (_, __) => { return newWindow(_, __); },
  addTab: (_, __, ___) => { return addTab(_, __, ___); },
  addRepository: (_) => { return addRepository(_); },
  removeRepository: (_, __) => { return removeRepository(_, __); }
};

function repositoriesTreeView({
  buffers,
  newWindow: newWindowDispatcher,
  addTab: addTabDispatcher,
  addRepository: addRepositoryDispatcher,
  removeRepository: removeRepositoryDispatcher
}: Props = defaultProps) {
  const items = buffers.filter((buf) => {
    return buf.itemType === ItemTypeRepository;
  }).map((rootBuf) => {
    return buildItems(rootBuf, buffers, newWindowDispatcher, addTabDispatcher, removeRepositoryDispatcher);
  });

  return (
    <div className={styles.treeView}>
      <ul className={styles.treeViewItems}>{items}</ul>
      <div className={styles.menu}>
        <span className={styles.menuItem}>
          <FontAwesome name="plus" onClick={(e) => { addRepositoryHandler(e, addRepositoryDispatcher); }} />
        </span>
      </div>
    </div>
  );
}

function buildItems(
  item: Buffer,
  repository: Buffer[],
  newWindowDispatcher: typeof newWindow,
  addTabDispatcher: typeof addTab,
  removeRepositoryDispatcher: typeof removeRepository
) {
  const spanClass = `${itemType(item.itemType)}`;

  let children = [];
  if (item.isOpened) {
    children = item.childrenIDs.map((childrenID) => {
      return repository.find((child) => {
        return child.id === childrenID;
      });
    }).filter(Boolean).map((child) => {
      return buildItems(child, repository, newWindowDispatcher, addTabDispatcher, removeRepositoryDispatcher);
    });
  }

  const ret = (
    <ul className={styles.repositoryItem} key={item.id}>
      <li
        role="menuitem"
        onClick={e => { return onClickItem(e, item); }}
        onKeyUp={e => { return onClickItem(e, item); }}
        onContextMenu={e => { return contextmenu(e, item, newWindowDispatcher, addTabDispatcher, removeRepositoryDispatcher); }}
      >
        <div>
          {icon(item)}
          <span className={spanClass}>
            {item.name}
          </span>
          {children}
        </div>
      </li>
    </ul>
  );

  return ret;
}

function onClickItem(e, item: Buffer) {
  e.preventDefault();
  e.stopPropagation();

  if (isSimilarFile(item.itemType) || isSimilarDirectory(item.itemType)) {
    return openFile(item);
  }
}

function toggleTreeView(e, buffer: Buffer) {
  e.preventDefault();
  e.stopPropagation();

  if (buffer.isOpened) {
    ipcRenderer.send('close-item', buffer.id);
  } else {
    ipcRenderer.send('open-item', buffer.id);
  }
}

function icon(item: Buffer) {
  switch (item.itemType) {
  case ItemTypeRepository:
    return <FontAwesome name="database" onClick={e => { return toggleTreeView(e, item); }} />;
  case ItemTypeDirectory:
    if (item.isOpened) {
      return <FontAwesome name="folder-open" onClick={e => { return toggleTreeView(e, item); }} />;
    }
    return <FontAwesome name="folder" onClick={e => { return toggleTreeView(e, item); }} />;

  case ItemTypeMarkdown:
    return <FontAwesome name="file-text" />;
  case ItemTypeText:
    return <FontAwesome name="file-text" />;
  case ItemTypeCSV:
    return <FontAwesome name="file-text" />;
  case ItemTypeTSV:
    return <FontAwesome name="file-text" />;
  case ItemTypeHTML:
    return <FontAwesome name="file-text" />;
  default:
    return <FontAwesome name="question-circle" />;
  }
}

function addRepositoryHandler(e, addRepositoryDispatcher) {
  e.preventDefault();
  e.stopPropagation();

  const w = remote.getCurrentWindow();

  remote.require('electron').dialog.showOpenDialog(w, {
    properties: ['openDirectory']
  }, (directories: Array<string>) => {
    directories.forEach((directory: string) => {
      addRepositoryDispatcher(directory);
    });
  });
}

function openFile(item: Buffer) {
  if (item.itemType === ItemTypeUndefined) {
    return;
  }

  ipcRenderer.send('open-page', { repositoryName: item.repositoryName, itemName: item.path });
}

function contextmenu(
  e,
  item: Buffer,
  newWindowDispatcher: typeof newWindow,
  addTabDispatcher: typeof addTab,
  removeRepositoryDispatcher: typeof removeRepository
) {
  e.preventDefault();
  e.stopPropagation();

  const template = buildContextMenu(item, newWindowDispatcher, addTabDispatcher, removeRepositoryDispatcher);
  const menu = remote.require('electron').Menu.buildFromTemplate(template);

  menu.popup(remote.getCurrentWindow());
}

export function buildContextMenu(
  item: Buffer,
  newWindowDispatcher: typeof newWindow,
  addTabDispatcher: typeof addTab,
  removeRepositoryDispatcher: typeof removeRepository
) {
  const ret = [];
  ret.push({
    label: 'edit on system editor',
    click: () => {
      ipcRenderer.send('open-by-system-editor', item.absolutePath);
    }
  });
  ret.push({
    label: 'edit on bamju editor',
    click: () => {
      ipcRenderer.send('open-by-bamju-editor', {
        parentWindowID: window.windowID,
        metaDataID: item.id,
      });
    },
    enabled: isSimilarFile(item.itemType),
  });
  ret.push({
    label: 'open new window',
    click: () => {
      const rectangle = remote.getCurrentWindow().getBounds();
      rectangle.x += 50;
      rectangle.y += 50;
      console.log('new window', rectangle);
      const win = newWindowDispatcher(rectangle);
      console.log('new window win', win);
      // TODO parseの結果の取得
      addTabDispatcher(win.windowID, item.id, 'content');
    }
  });
  ret.push({
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
        removeRepositoryDispatcher(item.absolutePath, item.repositoryName);
      }
    },
    enabled: item.itemType === ItemTypeRepository
  });

  return ret;
}

function itemType(t: ItemType) {
  if (isSimilarFile(t) || isSimilarDirectory(t)) {
    return styles.itemTypeAvailable;
  }

  return styles.itemTypeUnavailable;
}

const mapStateToProps = (state: State): {buffers: Buffer[]} => {
  if (state == null) {
    return {
      buffers: []
    };
  }

  return {
    buffers: state.global.buffers
  };
};


const mapDispatchToProps = (dispatch) => {
  return {
    newWindow: (rectangle: Rectangle, tabs: Tab[] = []) => {
      return dispatch(newWindow(rectangle, tabs));
    },
    addTab: (windowID: WindowID, metaDataID: MetaDataID, content: string = '') => {
      return dispatch(addTab(windowID, metaDataID, content));
    },
    addRepository: (absolutePath: string) => {
      return dispatch(addRepository(absolutePath));
    },
    removeRepository: (absolutePath: string, repositoryName: string) => {
      return dispatch(removeRepository(absolutePath, repositoryName));
    }
  };
};


export const RepositoriesTreeView = connect(mapStateToProps, mapDispatchToProps)(repositoriesTreeView);
