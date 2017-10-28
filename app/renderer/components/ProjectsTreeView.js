// @flow

import { ipcRenderer } from 'electron';
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Treebeard } from 'react-treebeard';
import { mainViewState } from '../reducers/main_view';
import * as Project from '../../common/project';

const path = require('path');

const projectsTreeView = ({ projects }) => {
  console.log('build projectsTreeView projects', projects);
  const data:treeBeardData = buildProjectsTree(projects);

  console.log('treeBeardData', data);

  return (
    <Treebeard data={data} onToggle={onToggle} />
  );
};

const onToggle = (node: treeBeardData, toggled) => {
  console.log('onToggle', node, toggled, this);
  console.log('projectsTreeView onToggle', node.id);
  openFile(node.id);

  if (this.state.cursor) { this.state.cursor.active = false; }
  node.active = true;
  if (node.children) { node.toggled = toggled; }
  this.setState({ cursor: node });
};

type treeBeardData = {
  id: string,
  name: string,
  children: Array<treeBeardData>,
  toggled: boolean
  // active: boolean,
  // loading: boolean,
  // decorators: Object,
  // animations: Object
};

const buildProjectsTree = (projects: Project.Projects): treeBeardData => {
  console.log('buildProjectsTree projects', projects);
  const ret:treeBeardData = {
    id: '/',
    name: 'root',
    toggled: true,
    children: []
  };

  projects.forEach((project: Project.Project) => {
    const node:treeBeardData = {
      id: path.join('/', project.name, project.path),
      name: project.name,
      toggled: true,
      children: []
    };

    console.log('forEach 1');
    project.items.forEach((file: Project.ProjectItem) => {
      const children:treeBeardData = loadProjectItems(file);
      console.log('buildProjectsTree children', children);
      node.children.push(children);
    });
    console.log('buildProjectsTree node', node);

    ret.children.push(node);
  });

  return ret;
};

const loadProjectItems = (file: Project.ProjectItem): treeBeardData => {
  console.log('loadProjectItems file', file);
  const fileItem:treeBeardData = {
    id: file.path,
    name: file.name,
    toggled: true,
    children: []
  };

  console.log('forEach 2');
  file.items.forEach((item) => {
    fileItem.children.push(loadProjectItems(item));
  });
  console.log('loadProjectItems fileItem', fileItem);

  return fileItem;
};

const openFile = (id: string) => {
  const items:Array<string> = id.split('/');
  console.log('projectsTreeView onToggle items', items);
  const projectName:string = items[1];
  const itemName: string = path.join('/', ...items.slice(2, items.length));
  console.log('projectsTreeView openFile', projectName, itemName);

  const itemType:Project.ItemType = Project.detectItemType(projectName, itemName);
  if (itemType === Project.ItemTypeUndefined) {
    return;
  }

  ipcRenderer.send('open-page', { projectName, itemName });
};

projectsTreeView.defaultProps = {
  projects: []
};

projectsTreeView.propTypes = {
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      path: PropTypes.string,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string,
          path: PropTypes.string
        })
      )
    })
  )
};

const mapStateToProps = (state: mainViewState) => {
  console.log('projectsTreeView mapStateToProps', state);

  return {
    projects: state.mainView.mainView.projects
  };
};


const mapDispatchToProps = (dispatch) => {
  console.log('projectsTreeView mapDispatchToProps', dispatch);

  return {};
};


const ProjectsTreeView = connect(mapStateToProps, mapDispatchToProps)(projectsTreeView);

export default ProjectsTreeView;
