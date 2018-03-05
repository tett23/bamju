// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import { remote } from 'electron';
import {
  openBuffer,
  closeBuffer,
} from '../../actions/repositories_tree_view';
import {
  addRepository,
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
import { ContextMenu } from '../contextmenu';
import {
  type MetaDataID,
  type ItemType,
  ItemTypeDirectory,
  ItemTypeRepository,
  ItemTypeUndefined,
  isSimilarFile,
  isSimilarDirectory,
} from '../../common/metadata';
import {
  type $ReturnType,
} from '../../common/util';
import FileIcon from './FileIcon';
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
        onContextMenu={e => { return contextmenu(e, item); }}
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
  let onClick = null;
  switch (item.itemType) {
  case ItemTypeRepository:
    onClick = (e) => { return toggleTreeView(e, item, bufferState, dispatcher); };
    break;
  case ItemTypeDirectory:
    if (bufferState.isOpened) {
      onClick = (e) => { return toggleTreeView(e, item, bufferState, dispatcher); };
    }
    onClick = (e) => { return toggleTreeView(e, item, bufferState, dispatcher); };
    break;
  default:
  }

  return (<FileIcon
    itemType={item.itemType}
    isOpened={bufferState.isOpened}
    onClick={onClick}
  />
  );
}

function addRepositoryHandler(e, dispatcher: $ReturnType<typeof mapDispatchToProps>) {
  e.preventDefault();
  e.stopPropagation();

  const w = remote.getCurrentWindow();

  remote.require('electron').dialog.showOpenDialog(w, {
    properties: ['openDirectory']
  }, (directories: Array<string>) => {
    directories.forEach((directory: string) => {
      dispatcher.addRepository(directory);
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
) {
  e.preventDefault();
  e.stopPropagation();

  new ContextMenu({ buffer: item }).show();
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
    addRepository: (absolutePath: string) => {
      return dispatch(addRepository(absolutePath));
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
  };
}


export const RepositoriesTreeView = connect(mapStateToProps, mapDispatchToProps)(repositoriesTreeView);

export default RepositoriesTreeView;
