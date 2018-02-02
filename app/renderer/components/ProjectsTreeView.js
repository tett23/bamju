// @flow

import { ipcRenderer, remote } from 'electron';
import * as React from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import type { TreeViewState } from '../reducers/tree_view';
import type { BufferItem, ItemType } from '../../common/project';
import { ItemTypeDirectory } from '../../common/project';
import styles from './ProjectsTreeView.css';
import { refreshTreeView } from '../actions/tree_view';

const {
  Menu, MenuItem, dialog
} = remote.require('electron');

type Props = {
  projects: Array<BufferItem>,
  refreshTreeView: (Array<BufferItem>) => void
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
    default:
    }
  }

  async toggleTreeView(e, item: BufferItem) {
    e.preventDefault();
    e.stopPropagation();

    console.log('projectsTreeView.toggleTreeView item', item);
    console.log('projectsTreeView.toggleTreeView props', this.props);
    if (item.isLoaded) {
      const projects = await closeTreeView(this.props.projects, item);
      this.props.refreshTreeView(projects);
    } else {
      const projects = await openTreeView(this.props.projects, item);
      this.props.refreshTreeView(projects);
    }
  }

  buildItems(items: Array<BufferItem>): Array<*> {
    if (items.length === 0) {
      return [];
    }

    const ret:Array<*> = items.map((item: BufferItem) => {
      const spanClass = `${itemType(item.itemType)}`;

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
              {this.buildItems(item.items)}
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
      return <FontAwesome name="database" />;
    case 'directory':
      if (item.isLoaded) {
        return <FontAwesome name="folder-open" onClick={e => { return this.toggleTreeView(e, item); }} />;
      }
      return <FontAwesome name="folder" onClick={e => { return this.toggleTreeView(e, item); }} />;

    case 'markdown':
      return <FontAwesome name="file-text" />;
    case 'text':
      return <FontAwesome name="file-text" />;
    default:
      return <FontAwesome name="question-circle" />;
    }
  }

  render() {
    console.log('projectsTreeView.render this', this);
    const { projects } = this.props;

    const items:Array<*> = projects.map((item: BufferItem) => {
      return (
        <li key={item.absolutePath}>
          {this.buildItems(item.items)}
        </li>
      );
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

async function closeTreeView(projects: Array<BufferItem>, projectItem: BufferItem): Promise<Array<BufferItem>> {
  const searchPath:string = projectItem.absolutePath;

  const find = async (items: Array<BufferItem>): Promise<Array<BufferItem>> => {
    return Promise.all(items.map(async (item: BufferItem): Promise<BufferItem> => {
      const r = item;
      if (item.absolutePath === searchPath) {
        r.items = [];
        r.isLoaded = false;
      } else {
        r.items = await find(item.items);
      }

      return r;
    }));
  };

  const ret:Array<BufferItem> = await Promise.all(projects.map(async (p: BufferItem): Promise<BufferItem> => {
    const r:BufferItem = p;
    r.items = await find(p.items);

    return r;
  }));

  return ret;
}

async function openTreeView(projects: Array<BufferItem>, projectItem: BufferItem): Promise<Array<BufferItem>> {
  const searchPath:string = projectItem.absolutePath;

  const find = async (items: Array<BufferItem>): Promise<Array<BufferItem>> => {
    return Promise.all(items.map(async (item: BufferItem): Promise<BufferItem> => {
      const r = item;
      if (item.absolutePath === searchPath) {
        // TODO: dispatchする
        // await r.load();
      } else {
        r.items = await find(item.items);
      }

      return r;
    }));
  };

  const ret:Array<BufferItem> = await Promise.all(projects.map(async (p: BufferItem): Promise<BufferItem> => {
    const r:BufferItem = p;
    r.items = await find(p.items);

    return r;
  }));

  return ret;
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
    label: 'open',
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
        ipcRenderer.send('remove-project', { path: item.absolutePath });
      }
    }));
  }
  menu.append(new MenuItem({
    label: 'reload',
    click: () => {
      ipcRenderer.send('reload-tree', { windowID: window.windowID, projectName: item.projectName, path: item.path });
    },
    enabled: item.itemType === ItemTypeDirectory
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
    }
  };
};


const ProjectsTreeView = connect(mapStateToProps, mapDispatchToProps)(projectsTreeView);

export default ProjectsTreeView;
