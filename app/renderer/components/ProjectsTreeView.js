// @flow

import { ipcRenderer } from 'electron';
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Treebeard } from 'react-treebeard';
import { mainViewState } from '../reducers/main_view';

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
  const items:Array<string> = node.id.split('/', 3);
  console.log('projectsTreeView onToggle items', items);
  const project:string = items[1];
  const path: string = items[2];

  ipcRenderer.send('open-page', { project, path });

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

const buildProjectsTree = (projects): treeBeardData => {
  console.log('buildProjectsTree projects', projects);
  const ret:treeBeardData = {
    id: '/',
    name: 'root',
    toggled: true,
    children: []
  };

  projects.forEach((project) => {
    const node:treeBeardData = {
      id: project.path,
      name: project.name,
      toggled: true,
      children: []
    };

    project.items.forEach((file) => {
      node.children.push(loadProjectItems(file));
    });

    ret.children.push(node);
  });

  return ret;
};

const loadProjectItems = (file): treeBeardData => {
  const fileItem:treeBeardData = {
    id: file.path,
    name: file.name,
    toggled: true,
    children: []
  };

  file.items.forEach((item) => {
    fileItem.children(loadProjectItems(item));
  });

  return fileItem;
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
