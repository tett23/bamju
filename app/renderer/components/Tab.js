// @flow

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const tab = ({ buf }) => <div>{buf}</div>;

tab.defaultProps = {
  buf: ''
};

tab.propTypes = {
  buf: PropTypes.string
};

const mapStateToProps = (state) => {
  console.log('Tab mapStateToProps', state);

  return {
    buf: state.mainView
  };
};


const mapDispatchToProps = (dispatch) => {
  console.log('Tab mapDispatchToProps', dispatch);

  return {};
};


const Tab = connect(mapStateToProps, mapDispatchToProps)(tab);

export default Tab;
