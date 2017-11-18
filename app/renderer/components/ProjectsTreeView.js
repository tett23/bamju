// @flow

import { ipcRenderer } from 'electron';
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Treebeard } from 'react-treebeard';
import type { mainViewState } from '../reducers/main_view';
import * as Project from '../../common/project';

const path = require('path');

const projectsTreeView = ({ projects }) => {
  const data:treeBeardData = buildProjectsTree(projects);

  return (
    <Treebeard data={data} onToggle={onToggle} />
  );
};

const onToggle = (node: treeBeardData, toggled) => {
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

    project.items.forEach((file: Project.ProjectItem) => {
      const children:treeBeardData = loadProjectItems(file);
      node.children.push(children);
    });

    ret.children.push(node);
  });

  return ret;
};

const loadProjectItems = (file: Project.ProjectItem): treeBeardData => {
  const fileItem:treeBeardData = {
    id: file.path,
    name: file.name,
    toggled: true,
    children: []
  };

  file.items.forEach((item) => {
    fileItem.children.push(loadProjectItems(item));
  });

  return fileItem;
};

const openFile = (id: string) => {
  const items:Array<string> = id.split('/');
  const projectName:string = items[1];
  const itemName: string = path.join('/', ...items.slice(2, items.length));

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
  projects: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    path: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      path: PropTypes.string
    }))
  }))
};

const mapStateToProps = (state: {mainView: mainViewState}) => {
  console.log('ProjectsTreeView mapStateToProps', state);

  return {
    projects:
    state.mainView.projects
  };
};


const mapDispatchToProps = (dispatch) => ({});


const ProjectsTreeView = connect(mapStateToProps, mapDispatchToProps)(projectsTreeView);

export default ProjectsTreeView;
