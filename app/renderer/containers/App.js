// @flow

import React from 'react';
import { connect } from 'react-redux';
import { RepositoriesTreeView } from '../components/RepositoriesTreeView';
import Browser from '../components/Browser';
import { Modals } from '../components/Modals';
import { Messages } from '../components/Messages';
import styles from './App.css';
import { initialBrowserState, type BrowserState } from '../../reducers/browser';
import { initialBuffersState, type BuffersState } from '../../reducers/buffers';

type appState = {
  buffers: BuffersState,
  browser: BrowserState
};

const app = ({ buffers, browser }: appState = defaultState) => {
  return (
    <div className={styles.app} data-tid="app">
      <RepositoriesTreeView buffers={buffers} />
      <Browser tabs={[browser.tabs]} />
      <Modals />
      <Messages />
    </div>
  );
};

// FIXME: いらない気がする
const defaultState = {
  buffers: initialBuffersState(),
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
