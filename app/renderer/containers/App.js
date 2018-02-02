// @flow

import React from 'react';
import { connect } from 'react-redux';
import ProjectsTreeView from '../components/ProjectsTreeView';
import Browser from '../components/Browser';
import NewFileDialog from '../components/NewFileDialog';
import styles from './App.css';
import { initialBrowserState, type BrowserState } from '../reducers/browser';
import { initialTreeViewState, type TreeViewState } from '../reducers/tree_view';
import { type ModalState } from '../reducers/modal';

type appState = {
  treeView: TreeViewState,
  browser: BrowserState,
  modal: ModalState
};

const app = ({ treeView, browser }: appState = defaultState) => {
  console.log('init app');
  console.log('create app VDOM', treeView, browser);

  return (
    <div className={styles.app} data-tid="app">
      <ProjectsTreeView treeView={treeView} />
      <Browser tabs={[browser.tabs]} />
      <NewFileDialog />
    </div>
  );
};

// FIXME: いらない気がする
const defaultState = {
  treeView: initialTreeViewState(),
  browser: initialBrowserState()
};

const mapStateToProps = (state) => {
  console.log('App mapStateToProps', state);

  return state;
};

const mapDispatchToProps = (dispatch) => {
  console.log('App mapDispatchToProps', dispatch);

  return {};
};

const App = connect(mapStateToProps, mapDispatchToProps)(app);

export default App;
