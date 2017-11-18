// @flow

// import { ipcRenderer } from 'electron';
import * as React from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import type { mainViewState } from '../reducers/main_view';
import * as Project from '../../common/project';
import styles from './ProjectsTreeView.css';
// import path from 'path';

const projectsTreeView = ({ projects }: {projects: Project.Projects}) => {
  console.log('build projectsTreeView projects', projects);

  const items:Array<React.Node> = [];
  projects.forEach((item: Project.Project) => {
    items.push((
      <li className={styles.project} key={item.absolutePath}>
        <div>
          {icon('project')}
          <span className={itemType('project')}>
            {item.name}
          </span>
          {buildItems(item.items)}
        </div>
      </li>
    ));
  });

  return <ul className={styles.treeView}>{items}</ul>;
};

const buildItems = (items: Project.ProjectItems): Array<React.Node> => {
  if (items.length === 0) {
    return [];
  }

  const ret:Array<React.Node> = [];

  items.forEach((item: Project.ProjectItem) => {
    const spanClass = `${itemType(item.itemType)}`;

    ret.push((
      <ul className={styles.projectItem} key={item.absolutePath}>
        <li>
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

const ProjectsTreeView2 = ProjectsTreeView;
export default ProjectsTreeView2;
