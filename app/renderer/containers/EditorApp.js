// @flow

import React from 'react';
import { connect } from 'react-redux';

const app = () => {
  return (
    <div data-tid="app">
      <div>editor</div>
    </div>
  );
};

// // FIXME: いらない気がする
// const defaultState = {
//   treeView: initialTreeViewState(),
//   browser: initialBrowserState()
// };
//
const mapStateToProps = (state) => {
  console.log('EditorApp mapStateToProps', state);

  return state;
};

const mapDispatchToProps = (dispatch) => {
  console.log('EditorApp mapDispatchToProps', dispatch);

  return {};
};

const App = connect(mapStateToProps, mapDispatchToProps)(app);

export default App;
