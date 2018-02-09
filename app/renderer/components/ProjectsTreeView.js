// @flow

import { ipcRenderer, remote } from 'electron';
import * as React from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import type { TreeViewState } from '../reducers/tree_view';
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
  ItemTypeUndefined,
} from '../../common/metadata';
import styles from './ProjectsTreeView.css';
import { refreshTreeView } from '../actions/tree_view';

const {
  Menu, MenuItem, dialog
} = remote.require('electron');

type Props = {
  repositories: {[string]: Buffer[]}
};

class projectsTreeView extends React.Component<Props> {
  static defaultProps = {
    projects: []
  };

  constructor(props) {
    console.log('projectTreeView constructor', props);
    super(props);
  }

  onClickItem(e, item: Buffer) {
    console.log(this);

    e.preventDefault();
    e.stopPropagation();
    console.log('projectsTreeView.onClick', item);

    switch (item.itemType) {
    case ItemTypeRepository:
      return openFile(item);
    case ItemTypeDirectory:
      return openFile(item);
    case ItemTypeMarkdown:
      return openFile(item);
    case ItemTypeText:
      return openFile(item);
    case ItemTypeCSV:
      return openFile(item);
    case ItemTypeTSV:
      return openFile(item);
    default:
    }
  }

  buildItems(items: Buffer[]): Array<*> {
    if (items.length === 0) {
      return [];
    }

    const ret:Array<*> = items.map((item: Buffer) => {
      const spanClass = `${itemType(item.itemType)}`;

      let children = [];
      if (item.isOpened) {
        const childBuffers = item.childrenIDs.map((childrenID) => {
          return items.find((child) => {
            return child.id === childrenID;
          });
        }).filter(Boolean);
        children = this.buildItems(childBuffers);
      }

      return ((
        <ul className={styles.projectItem} key={item.absolutePath}>
          <li
            role="menuitem"
            onClick={e => { return this.onClickItem(e, item); }}
            onKeyUp={e => { return this.onClickItem(e, item); }}
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
      ));
    });

    return ret;
  }

  render() {
    console.log('projectsTreeView.render this', this);
    const items = Object.keys(this.props.repositories).map((repositoryName) => {
      return this.buildItems(this.props.repositories[repositoryName]);
    });

    return (
      <div className={styles.treeView}>
        <ul className={styles.treeViewItems}>{items}</ul>
        <div className={styles.menu}>
          <span className={styles.menuItem}>
            <FontAwesome name="plus" onClick={addProject} />
          </span>
        </div>
      </div>
    );
  }
}

function toggleTreeView(e, item: Buffer) {
  e.preventDefault();
  e.stopPropagation();

  if (item.isOpened) {
    ipcRenderer.send('close-item', { repositoryName: item.repositoryName, path: item.path });
  } else {
    ipcRenderer.send('open-item', { repositoryName: item.repositoryName, path: item.path });
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
  default:
    return <FontAwesome name="question-circle" />;
  }
}

function addProject(e) {
  e.preventDefault();
  e.stopPropagation();

  const w = remote.getCurrentWindow();

  dialog.showOpenDialog(w, {
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

  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'edit on system editor',
    click: () => {
      ipcRenderer.send('open-by-system-editor', item.absolutePath);
    }
  }));
  menu.append(new MenuItem({
    label: 'edit on bamju editor',
    click: () => {
      ipcRenderer.send('open-by-bamju-editor', {
        parentWindowID: window.windowID,
        repositoryName: item.repositoryName,
        itemName: item.path
      });
    },
    enabled: item.itemType === ItemTypeMarkdown || item.itemType === ItemTypeText
  }));
  menu.append(new MenuItem({
    label: 'open new window',
    click: () => {
      ipcRenderer.send('open-new-window', { windowID: window.windowID, repositoryName: item.repositoryName, itemName: item.path });
    }
  }));
  if (item.path === '/') {
    menu.append(new MenuItem({
      label: 'remove',
      click: () => {
        const choice = dialog.showMessageBox(remote.getCurrentWindow(), {
          type: 'question',
          buttons: ['Yes', 'No'],
          title: '削除しますか',
          message: '削除しますか'
        });
        if (choice === 0) {
          ipcRenderer.send('remove-repository', { path: item.absolutePath });
        }
      }
    }));
  }

  menu.popup(remote.getCurrentWindow());
}

function itemType(t: ItemType) {
  switch (t) {
  case ItemTypeRepository:
    return styles.itemTypeAvailable;
  case ItemTypeDirectory:
    return styles.itemTypeAvailable;
  case ItemTypeMarkdown:
    return styles.itemTypeAvailable;
  case ItemTypeText:
    return styles.itemTypeAvailable;
  case ItemTypeCSV:
    return styles.itemTypeAvailable;
  case ItemTypeTSV:
    return styles.itemTypeAvailable;
  default:
    return styles.itemTypeUnavailable;
  }
}

const mapStateToProps = (state: {treeView: TreeViewState}): {repositories: {[string]: Buffer[]}} => {
  console.log('projectsTreeView mapStateToProps', state);
  if (state == null) {
    return {
      repositories: {}
    };
  }

  return {
    repositories: state.treeView.repositories
  };
};


const mapDispatchToProps = (dispatch) => {
  console.log('projectsTreeView mapDispatchToProps', dispatch);

  return {
    refreshTreeView: (repositories: {[string]: Buffer[]}) => {
      dispatch(refreshTreeView(repositories));
    }
  };
};


const ProjectsTreeView = connect(mapStateToProps, mapDispatchToProps)(projectsTreeView);

export default ProjectsTreeView;
