// @flow

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { mainViewState } from '../reducers/main_view';
import { Treebeard } from 'react-treebeard';

const projectsTreeView = ({ projects }) => {
  console.log('build projectsTreeView projects', projects);
  const data:treeBeardData = buildProjectsTree(projects);

  console.log('treeBeardData', data);

  return (
    <Treebeard data={data} />
  );
};

// const onToggle = (node, toggled) => {
//   if (this.state.cursor) { this.state.cursor.active = false; }
//   node.active = true;
//   if (node.children) { node.toggled = toggled; }
//   this.setState({ cursor: node });
// };

type treeBeardData = {
  name: string,
  toggled: boolean,
  children: Array<treeBeardData>
};

const buildProjectsTree = (projects): treeBeardData => {
  console.log('buildProjectsTree projects', projects);
  const ret:treeBeardData = {
    name: 'root',
    toggled: true,
    children: []
  };

  projects.forEach((project) => {
    console.log('forEach 1 project', project);
    const node:treeBeardData = {
      name: project.name,
      toggled: true,
      children: []
    };

    console.log('forEach 1');
    project.items.forEach((file) => {
      console.log('forEach 2');
      node.children.push(loadProjectItems(file));
    });

    ret.children.push(node);
  });

  return ret;
};

const loadProjectItems = (file): treeBeardData => {
  const fileItem:treeBeardData = {
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
