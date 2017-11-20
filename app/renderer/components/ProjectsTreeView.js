// @flow

import { ipcRenderer, remote } from 'electron';
import * as React from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import type { mainViewState } from '../reducers/main_view';
import type { Projects, Project, ProjectItems, ProjectItem, ItemType } from '../../common/project';
import styles from './ProjectsTreeView.css';
import { refreshTreeView } from '../actions/tree_view';

const { Menu, MenuItem } = remote.require('electron');

type Props = {
  projects: Projects,
  refreshTreeView: (Projects) => void
};

class projectsTreeView extends React.Component<Props> {
  static defaultProps = {
    projects: []
  };

  constructor(props) {
    console.log('projectTreeView constructor', props);
    super(props);
  }

  onClickItem(e, item: ProjectItem) {
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

  async toggleTreeView(e, item: ProjectItem) {
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

  buildItems(items: ProjectItems): Array<*> {
    if (items.length === 0) {
      return [];
    }

    const ret:Array<*> = items.map((item: ProjectItem) => {
      const spanClass = `${itemType(item.itemType)}`;

      return ((
        <ul className={styles.projectItem} key={item.absolutePath}>
          <li
            role="menuitem"
            onClick={e => this.onClickItem(e, item)}
            onKeyUp={e => this.onClickItem(e, item)}
            onContextMenu={e => contextmenu(e, item.absolutePath)}
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

  icon(item: ProjectItem) {
    switch (item.itemType) {
    case 'project':
      return <FontAwesome name="database" />;
    case 'directory':
      if (item.isLoaded) {
        return <FontAwesome name="folder-open" onClick={e => this.toggleTreeView(e, item)} />;
      }
      return <FontAwesome name="folder" onClick={e => this.toggleTreeView(e, item)} />;

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

    const items:Array<*> = projects.map((item: Project) => (
      <li key={item.absolutePath}>
        {this.buildItems(item.items)}
      </li>
    ));

    return <ul className={styles.treeView}>{items}</ul>;
  }
}

async function closeTreeView(projects: Projects, projectItem: ProjectItem): Promise<Projects> {
  const searchPath:string = projectItem.absolutePath;

  const find = async (items: ProjectItems): Promise<ProjectItems> => Promise.all(items.map(async (item: ProjectItem): Promise<ProjectItem> => {
    const r = item;
    if (item.absolutePath === searchPath) {
      r.items = [];
      r.isLoaded = false;
    } else {
      r.items = await find(item.items);
    }

    return r;
  }));

  const ret:Projects = await Promise.all(projects.map(async (p: Project): Promise<Project> => {
    const r:Project = p;
    r.items = await find(p.items);

    return r;
  }));

  return ret;
}

async function openTreeView(projects: Projects, projectItem: ProjectItem): Promise<Projects> {
  const searchPath:string = projectItem.absolutePath;

  const find = async (items: ProjectItems): Promise<ProjectItems> => Promise.all(items.map(async (item: ProjectItem): Promise<ProjectItem> => {
    const r = item;
    if (item.absolutePath === searchPath) {
      await r.load();
    } else {
      r.items = await find(item.items);
    }

    return r;
  }));

  const ret:Projects = await Promise.all(projects.map(async (p: Project): Promise<Project> => {
    const r:Project = p;
    r.items = await find(p.items);

    return r;
  }));

  return ret;
}


function openFile(item: ProjectItem) {
  if (item.itemType === 'undefined') {
    return;
  }

  ipcRenderer.send('open-page', { projectName: item.projectName, itemName: item.path });
}

function contextmenu(e, absolutePath: string) {
  e.preventDefault();
  e.stopPropagation();

  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'open',
    click: () => {
      ipcRenderer.send('open-by-editor', absolutePath);
    }
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

const mapStateToProps = (state: {mainView: mainViewState}): {projects: Projects} => {
  console.log('projectsTreeView mapStateToProps', state);

  return {
    projects: state.mainView.projects
  };
};


const mapDispatchToProps = (dispatch) => {
  console.log('projectsTreeView mapDispatchToProps', dispatch);

  return {
    refreshTreeView: (projects: Projects) => {
      dispatch(refreshTreeView(projects));
    }
  };
};


const ProjectsTreeView = connect(mapStateToProps, mapDispatchToProps)(projectsTreeView);

export default ProjectsTreeView;
