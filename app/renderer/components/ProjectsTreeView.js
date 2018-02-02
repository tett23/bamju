// @flow

import { ipcRenderer, remote } from 'electron';
import * as React from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import type { TreeViewState } from '../reducers/tree_view';
import type { BufferItem, ItemType } from '../../common/project';
import { ItemTypeDirectory, ItemTypeProject } from '../../common/project';
import styles from './ProjectsTreeView.css';
import { refreshTreeView, closeTreeViewItem } from '../actions/tree_view';

const {
  Menu, MenuItem, dialog
} = remote.require('electron');

type Props = {
  projects: Array<BufferItem>,
  closeTreeViewItem: (string, string) => void
};

class projectsTreeView extends React.Component<Props> {
  static defaultProps = {
    projects: []
  };

  constructor(props) {
    console.log('projectTreeView constructor', props);
    super(props);
  }

  onClickItem(e, item: BufferItem) {
    console.log(this);

    e.preventDefault();
    e.stopPropagation();
    console.log('projectsTreeView.onClick', item);

    switch (item.itemType) {
    case 'project':
      return openFile(item);
    case 'directory':
      return openFile(item);
    case 'markdown':
      return openFile(item);
    case 'text':
      return openFile(item);
    case 'csv':
      return openFile(item);
    case 'tsv':
      return openFile(item);
    default:
    }
  }

  async toggleTreeView(e, item: BufferItem) {
    e.preventDefault();
    e.stopPropagation();

    console.log('projectsTreeView.toggleTreeView item', item);
    console.log('projectsTreeView.toggleTreeView props', this.props);
    if (item.isOpened) {
      this.props.closeTreeViewItem(item.projectName, item.path);
    } else {
      ipcRenderer.send('reload-tree', { projectName: item.projectName, path: item.path });
    }
  }

  buildItems(items: Array<BufferItem>): Array<*> {
    if (items.length === 0) {
      return [];
    }

    const ret:Array<*> = items.map((item: BufferItem) => {
      const spanClass = `${itemType(item.itemType)}`;

      let children = [];
      if (item.isOpened) {
        children = this.buildItems(item.items);
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
              {this.icon(item)}
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

  icon(item: BufferItem) {
    switch (item.itemType) {
    case 'project':
      return <FontAwesome name="database" onClick={e => { return this.toggleTreeView(e, item); }} />;
    case 'directory':
      if (item.isOpened) {
        return <FontAwesome name="folder-open" onClick={e => { return this.toggleTreeView(e, item); }} />;
      }
      return <FontAwesome name="folder" onClick={e => { return this.toggleTreeView(e, item); }} />;

    case 'markdown':
      return <FontAwesome name="file-text" />;
    case 'text':
      return <FontAwesome name="file-text" />;
    case 'csv':
      return <FontAwesome name="file-text" />;
    case 'tsv':
      return <FontAwesome name="file-text" />;
    default:
      return <FontAwesome name="question-circle" />;
    }
  }

  render() {
    console.log('projectsTreeView.render this', this);
    const items = this.buildItems(this.props.projects);

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

function addProject(e) {
  e.preventDefault();
  e.stopPropagation();

  const w = remote.getCurrentWindow();

  dialog.showOpenDialog(w, {
    properties: ['openDirectory']
  }, (directories: Array<string>) => {
    directories.forEach((directory: string) => {
      ipcRenderer.send('add-project', { path: directory });
    });
  });
}

function openFile(item: BufferItem) {
  if (item.itemType === 'undefined') {
    return;
  }

  ipcRenderer.send('open-page', { windowID: window.windowID, projectName: item.projectName, itemName: item.path });
}

function contextmenu(e, item: BufferItem) {
  e.preventDefault();
  e.stopPropagation();

  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'edit on system editor',
    click: () => {
      ipcRenderer.send('open-by-editor', item.absolutePath);
    }
  }));
  menu.append(new MenuItem({
    label: 'open new window',
    click: () => {
      ipcRenderer.send('open-new-window', { windowID: window.windowID, projectName: item.projectName, itemName: item.path });
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
          ipcRenderer.send('remove-project', { path: item.absolutePath });
        }
      }
    }));
  }
  menu.append(new MenuItem({
    label: 'reload',
    click: () => {
      ipcRenderer.send('reload-tree', { projectName: item.projectName, path: item.path });
    },
    enabled: item.itemType === ItemTypeDirectory || item.itemType === ItemTypeProject
  }));

  menu.popup(remote.getCurrentWindow());
}

function itemType(t: ItemType) {
  switch (t) {
  case 'project':
    return styles.itemTypeAvailable;
  case 'directory':
    return styles.itemTypeAvailable;
  case 'markdown':
    return styles.itemTypeAvailable;
  case 'text':
    return styles.itemTypeAvailable;
  case 'csv':
    return styles.itemTypeAvailable;
  case 'tsv':
    return styles.itemTypeAvailable;
  default:
    return styles.itemTypeUnavailable;
  }
}

const mapStateToProps = (state: {treeView: TreeViewState}): {projects: Array<BufferItem>} => {
  console.log('projectsTreeView mapStateToProps', state);
  if (state == null) {
    return { projects: [] };
  }

  return {
    projects: state.treeView.projects
  };
};


const mapDispatchToProps = (dispatch) => {
  console.log('projectsTreeView mapDispatchToProps', dispatch);

  return {
    refreshTreeView: (projects: Array<BufferItem>) => {
      dispatch(refreshTreeView(projects));
    },
    closeTreeViewItem: (projectName: string, path: string) => {
      dispatch(closeTreeViewItem(projectName, path));
    },
  };
};


const ProjectsTreeView = connect(mapStateToProps, mapDispatchToProps)(projectsTreeView);

export default ProjectsTreeView;
