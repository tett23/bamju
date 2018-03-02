// @flow

import { ipcRenderer, remote } from 'electron';
import * as React from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import {
  type Rectangle,
  type Tab,
  newWindow,
  newEditorWindow,
} from '../../actions/windows';
import {
  addTab,
} from '../../actions/browser';
import {
  openBuffer,
  closeBuffer,
} from '../../actions/repositories_tree_view';
import {
  addRepository,
  removeRepository,
} from '../../actions/repositories';
import {
  parseMetaData,
} from '../../actions/parser';
import type { State } from '../../reducers/app_window';
import {
  type BufferState,
  initialBufferState,
} from '../../reducers/repositories_tree_view';
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
  type $ReturnType,
} from '../../common/util';
import styles from './RepositoriesTreeView.css';

type Props = $ReturnType<typeof mapStateToProps> & $ReturnType<typeof mapDispatchToProps>;

function repositoriesTreeView(props: Props) {
  const items = props.buffers.filter((buf) => {
    return buf.itemType === ItemTypeRepository;
  }).map((rootBuf) => {
    return buildItems(rootBuf, props);
  });

  return (
    <div className={styles.treeView}>
      <ul className={styles.treeViewItems}>{items}</ul>
      <div className={styles.menu}>
        <span className={styles.menuItem}>
          <FontAwesome name="plus" onClick={(e) => { addRepositoryHandler(e, props); }} />
        </span>
      </div>
    </div>
  );
}

function buildItems(
  item: Buffer,
  props: Props,
) {
  const spanClass = `${itemType(item.itemType)}`;

  const itemState = props.treeView[item.id] || initialBufferState();

  let children = [];
  if (itemState.isOpened) {
    children = item.childrenIDs.map((childrenID) => {
      return props.buffers.find((child) => {
        return child.id === childrenID;
      });
    }).filter(Boolean).map((child) => {
      return buildItems(child, props);
    });
  }

  const ret = (
    <ul className={styles.repositoryItem} key={item.id}>
      <li
        role="menuitem"
        onClick={e => { return onClickItem(e, item, props.currentTabID, props); }}
        onKeyUp={e => { return onClickItem(e, item, props.currentTabID, props); }}
        onContextMenu={e => { return contextmenu(e, item, props); }}
      >
        <div>
          {icon(item, itemState, props)}
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

function onClickItem(e, item: Buffer, tabID: string, dispatcher: $ReturnType<typeof mapDispatchToProps>) {
  e.preventDefault();
  e.stopPropagation();

  if (isSimilarFile(item.itemType) || isSimilarDirectory(item.itemType)) {
    return openFile(item, tabID, dispatcher);
  }
}

function toggleTreeView(e, buffer: Buffer, bufferState: BufferState, dispatcher: $ReturnType<typeof mapDispatchToProps>) {
  e.preventDefault();
  e.stopPropagation();

  if (bufferState.isOpened) {
    dispatcher.closeBuffer(buffer.id);
  } else {
    dispatcher.openBuffer(buffer.id);
  }
}

function icon(item: Buffer, bufferState: BufferState, dispatcher: $ReturnType<typeof mapDispatchToProps>) {
  switch (item.itemType) {
  case ItemTypeRepository:
    return <FontAwesome name="database" onClick={e => { return toggleTreeView(e, item, bufferState, dispatcher); }} />;
  case ItemTypeDirectory:
    if (bufferState.isOpened) {
      return <FontAwesome name="folder-open" onClick={e => { return toggleTreeView(e, item, bufferState, dispatcher); }} />;
    }
    return <FontAwesome name="folder" onClick={e => { return toggleTreeView(e, item, bufferState, dispatcher); }} />;

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

function addRepositoryHandler(e, dispatcher: $ReturnType<typeof mapDispatchToProps>) {
  e.preventDefault();
  e.stopPropagation();

  const w = remote.getCurrentWindow();

  remote.require('electron').dialog.showOpenDialog(w, {
    properties: ['openDirectory']
  }, (directories: Array<string>) => {
    directories.forEach((directory: string) => {
      dispatcher.addRepositoryDispatcher(directory);
    });
  });
}

function openFile(item: Buffer, tabID: string, dispatcher: $ReturnType<typeof mapDispatchToProps>) {
  if (item.itemType === ItemTypeUndefined) {
    return;
  }

  dispatcher.parseMetaData(tabID, item.id);
}

function contextmenu(
  e,
  item: Buffer,
  dispatcher: $ReturnType<typeof mapDispatchToProps>
) {
  e.preventDefault();
  e.stopPropagation();

  const template = buildContextMenu(item, dispatcher);
  const menu = remote.require('electron').Menu.buildFromTemplate(template);

  menu.popup(remote.getCurrentWindow());
}

export function buildContextMenu(
  item: Buffer,
  dispatcher: $ReturnType<typeof mapDispatchToProps>
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
      dispatcher.newEditorWindow(item.id);
    },
    enabled: isSimilarFile(item.itemType),
  });
  ret.push({
    label: 'open new window',
    click: () => {
      const rectangle = remote.getCurrentWindow().getBounds();
      rectangle.x += 50;
      rectangle.y += 50;
      dispatcher.newWindow(rectangle, [addTab(item.id, '').payload]);
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
        dispatcher.removeRepositoryDispatcher(item.absolutePath, item.repositoryName);
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

function mapStateToProps(state: State) {
  const currentTabID = state.browser.currentTabID;

  return {
    buffers: state.global.buffers,
    treeView: state.repositoriesTreeView,
    currentTabID
  };
}

function mapDispatchToProps(dispatch) {
  return {
    newWindow: (rectangle: Rectangle, tabs: Tab[] = []) => {
      return dispatch(newWindow(rectangle, tabs));
    },
    addRepository: (absolutePath: string) => {
      return dispatch(addRepository(absolutePath));
    },
    removeRepository: (absolutePath: string, repositoryName: string) => {
      return dispatch(removeRepository(absolutePath, repositoryName));
    },
    parseMetaData: (tabID: string, metaDataID: MetaDataID) => {
      return dispatch(parseMetaData(tabID, metaDataID));
    },
    openBuffer: (metaDataID: MetaDataID) => {
      return dispatch(openBuffer(metaDataID));
    },
    closeBuffer: (metaDataID: MetaDataID) => {
      return dispatch(closeBuffer(metaDataID));
    },
    newEditorWindow: (metaDataID: MetaDataID) => {
      return dispatch(newEditorWindow(metaDataID));
    }
  };
}


export const RepositoriesTreeView = connect(mapStateToProps, mapDispatchToProps)(repositoriesTreeView);
