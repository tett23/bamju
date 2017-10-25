// @flow

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { mainViewState } from '../reducers/main_view';

const treeView = ({ projects }) => {
  console.log('refresh treeView', projects);

  const projectsDOM = [];
  projects.forEach((project) => {
    console.log('treeView foreach item', project);

    const fileItems = [];
    project.items.forEach((file) => {
      fileItems.push(<div key={file.name}>{file.name}</div>);
    });

    projectsDOM.push(<div key={project.name}>
      <div>{name}</div>
      <div>{fileItems}</div>
    </div>);
  });

  console.log('project DOM', projectsDOM);
  return (<div>
    {projectsDOM}
  </div>);
};

treeView.defaultProps = {
  projects: []
};

treeView.propTypes = {
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
  console.log('TreeView mapStateToProps', state);

  return {
    projects: state.mainView.mainView.projects
  };
};


const mapDispatchToProps = (dispatch) => {
  console.log('TreeView mapDispatchToProps', dispatch);

  return {};
};


const TreeView = connect(mapStateToProps, mapDispatchToProps)(treeView);

export default TreeView;
