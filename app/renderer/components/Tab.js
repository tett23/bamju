// @flow

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { mainViewState } from '../reducers/main_view';

const tab = ({ buf }) => {
  console.log('refresh tab', buf);
  return <div>{buf}</div>;
};

tab.defaultProps = {
  buf: ''
};

tab.propTypes = {
  buf: PropTypes.string
};

const mapStateToProps = (state: mainViewState) => {
  console.log('Tab mapStateToProps', state);

  return {
    buf: state.mainView.mainView.tab
  };
};


const mapDispatchToProps = (dispatch) => {
  console.log('Tab mapDispatchToProps', dispatch);

  return {};
};


const Tab = connect(mapStateToProps, mapDispatchToProps)(tab);

export default Tab;
