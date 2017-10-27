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
  const t:?Object = state.mainView.mainView.browser.tabs[0];

  let buf:string = '';
  if (t !== undefined) {
    buf = t.buf;
  }

  return {
    buf
  };
};


const mapDispatchToProps = (dispatch) => {
  console.log('Tab mapDispatchToProps', dispatch);

  return {};
};


const Tab = connect(mapStateToProps, mapDispatchToProps)(tab);

export default Tab;
