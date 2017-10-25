// @flow

import React from 'react';
import { connect } from 'react-redux';
// import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import Tab from '../components/Tab';
// import { openFragmentByTreeViewOnClick } from '../actions/tree_view';
import { initialMainViewState } from '../reducers/main_view';
import styles from './App.css';

const app = ({ mainView }) => (
  <div className={styles.app} data-tid="app">
    <Tab buf={mainView.tab} />
  </div>
);

app.defaultProps = {
  mainView: initialMainViewState()
};

app.propTypes = {
  mainView: PropTypes.shape({
    tab: PropTypes.string
  })
};

const mapStateToProps = (state) => {
  console.log('App mapStateToProps', state);

  return {
    mainView: state.mainView,
  };
};

const mapDispatchToProps = (dispatch) => {
  console.log('App mapDispatchToProps', dispatch);

  // return {
  //   onFragmentClick: bindActionCreators(openFragmentByTreeViewOnClick, dispatch)
  // };
  return {};
};

const App = connect(mapStateToProps, mapDispatchToProps)(app);

export default App;
