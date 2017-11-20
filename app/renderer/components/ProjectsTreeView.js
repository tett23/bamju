// @flow

import { ipcRenderer, remote } from 'electron';
import * as React from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import type { mainViewState } from '../reducers/main_view';
import * as Project from '../../common/project';
import styles from './ProjectsTreeView.css';

const { Menu, MenuItem } = remote.require('electron');

const projectsTreeView = ({ projects }: {projects: Project.Projects}) => {
  console.log('build projectsTreeView projects', projects);

  // const items:Array<React.Node> = [];
  const items:Array<any> = projects.map((item: Project.Project) => (
    <li key={item.absolutePath}>
      {buildItems(item.items)}
    </li>
  ));
    // (
    //   <li
    //     className={styles.project}
    //     key={item.absolutePath}
    //     role="menuitem"
    //     onClick={e => onClick(e, item.items[0])}
    //     onKeyUp={e => onClick(e, item.items[0])}
    //     onContextMenu={e => contextmenu(e, item.absolutePath)}
    //   >
    //     <div>
    //       {icon('project')}
    //       <span className={itemType('project')}>
    //         {item.name}
    //       </span>
    //       {buildItems(item.items)}
    //     </div>
    //   </li>
    // )

  return <ul className={styles.treeView}>{items}</ul>;
};

const buildItems = (items: Project.ProjectItems): Array<any> => {
  if (items.length === 0) {
    return [];
  }

  const ret:Array<any> = items.map((item: Project.ProjectItem) => {
    const spanClass = `${itemType(item.itemType)}`;

    return ((
      <ul className={styles.projectItem} key={item.absolutePath}>
        <li
          role="menuitem"
          onClick={e => onClick(e, item)}
          onKeyUp={e => onClick(e, item)}
          onContextMenu={e => contextmenu(e, item.absolutePath)}
        >
          <div>
            {icon(item.itemType)}
            <span className={spanClass}>
              {item.name}
            </span>
            {buildItems(item.items)}
          </div>
        </li>
      </ul>
    ));
  });

  return ret;
};

function onClick(e, item: Project.ProjectItem) {
  e.preventDefault();

  switch (item.itemType) {
  case 'project':
    return toggleDirectory(item);
  case 'directory':
    return toggleDirectory(item);
  case 'markdown':
    return openFile(item);
  case 'text':
    return openFile(item);
  default:
  }
}

function toggleDirectory(item: Project.ProjectItem) {
}

function openFile(item: Project.ProjectItem) {
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

function icon(t: Project.ItemType) {
  switch (t) {
  case 'project':
    return <FontAwesome name="database" />;
  case 'directory':
    return <FontAwesome name="folder" />;
  case 'markdown':
    return <FontAwesome name="file-text" />;
  case 'text':
    return <FontAwesome name="file-text" />;
  default:
    return <FontAwesome name="question-circle" />;
  }
}

function itemType(t: Project.ItemType) {
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

projectsTreeView.defaultProps = {
  projects: []
};

projectsTreeView.prop = { projects: Project.Projects };

const mapStateToProps = (state: {mainView: mainViewState}): {projects: Project.Projects} => {
  console.log('projectsTreeView mapStateToProps', state);

  return {
    projects: state.mainView.projects
  };
};


const mapDispatchToProps = (dispatch) => {
  console.log('projectsTreeView mapDispatchToProps', dispatch);

  return {};
};


const ProjectsTreeView = connect(mapStateToProps, mapDispatchToProps)(projectsTreeView);

export default ProjectsTreeView;
