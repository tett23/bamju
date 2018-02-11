// @flow

import { ipcRenderer, remote } from 'electron';
import * as React from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import type { RepositoriesState } from '../reducers/repositories';
import {
  type Buffer
} from '../../common/buffer';
import {
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
import styles from './RepositoriesTreeView.css';
import { reloadRepositories } from '../actions/repositories';

type Props = {
  repositories: RepositoriesState
};

class repositoriesTreeView extends React.Component<Props> {
  static defaultProps = {
    repositories: {}
  };

  render() {
    const items = Object.keys(this.props.repositories).map((repositoryName) => {
      const repo = this.props.repositories[repositoryName];
      const rootItem = repo.find((item) => {
        return item.itemType === ItemTypeRepository;
      });
      if (rootItem == null) {
        return null;
      }

      return buildItems(rootItem, repo);
    });

    return (
      <div className={styles.treeView}>
        <ul className={styles.treeViewItems}>{items}</ul>
        <div className={styles.menu}>
          <span className={styles.menuItem}>
            <FontAwesome name="plus" onClick={addRepository} />
          </span>
        </div>
      </div>
    );
  }
}

function buildItems(item: Buffer, repository: Buffer[]) {
  const spanClass = `${itemType(item.itemType)}`;

  let children = [];
  if (item.isOpened) {
    children = item.childrenIDs.map((childrenID) => {
      return repository.find((child) => {
        return child.id === childrenID;
      });
    }).filter(Boolean).map((child) => {
      return buildItems(child, repository);
    });
  }

  const ret = (
    <ul className={styles.repositoryItem} key={item.id}>
      <li
        role="menuitem"
        onClick={e => { return onClickItem(e, item); }}
        onKeyUp={e => { return onClickItem(e, item); }}
        onContextMenu={e => { return contextmenu(e, item); }}
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
    ipcRenderer.send('close-item', buffer);
  } else {
    ipcRenderer.send('open-item', buffer);
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

function addRepository(e) {
  e.preventDefault();
  e.stopPropagation();

  const w = remote.getCurrentWindow();

  remote.require('electron').dialog.showOpenDialog(w, {
    properties: ['openDirectory']
  }, (directories: Array<string>) => {
    directories.forEach((directory: string) => {
      ipcRenderer.send('add-repository', directory);
    });
  });
}

function openFile(item: Buffer) {
  if (item.itemType === ItemTypeUndefined) {
    return;
  }

  ipcRenderer.send('open-page', { repositoryName: item.repositoryName, itemName: item.path });
}

function contextmenu(e, item: Buffer) {
  e.preventDefault();
  e.stopPropagation();

  const template = buildContextMenu(item);
  const menu = remote.require('electron').Menu.buildFromTemplate(template);

  menu.popup(remote.getCurrentWindow());
}

export function buildContextMenu(item: Buffer) {
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
        repositoryName: item.repositoryName,
        itemName: item.path
      });
    },
    enabled: isSimilarFile(item.itemType),
  });
  ret.push({
    label: 'open new window',
    click: () => {
      ipcRenderer.send('open-new-window', { windowID: window.windowID, repositoryName: item.repositoryName, itemName: item.path });
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
        ipcRenderer.send('remove-repository', { path: item.absolutePath });
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

const mapStateToProps = (state: {repositories: RepositoriesState}): {repositories: RepositoriesState} => {
  if (state == null) {
    return {
      repositories: {}
    };
  }

  return {
    repositories: state.repositories
  };
};


const mapDispatchToProps = (dispatch) => {
  return {
    reloadRepositories: (repositories: {[string]: Buffer[]}) => {
      dispatch(reloadRepositories(repositories));
    }
  };
};


export const RepositoriesTreeView = connect(mapStateToProps, mapDispatchToProps)(repositoriesTreeView);
