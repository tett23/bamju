// @flow

import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { mainViewState } from '../reducers/main_view';
import Tab from './Tab';

const browser = ({ tabs }) => {
  console.log('refresh browser', tabs);
  console.log('refresh browser buf=', tabs[0].buf);

  const buf:string = tabs[0].buf;

  return (
    <Tab buf={buf} />
  );
};

browser.defaultProps = {
  tabs: []
};

browser.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      path: PropTypes.path,
      buf: PropTypes.string
    })
  )
};

const mapStateToProps = (state: mainViewState) => {
  console.log('Browser mapStateToProps', state);

  const tabs = [];

  state.mainView.mainView.browser.tabs.forEach((tab) => {
    tabs.push(tab);
  });

  return {
    tabs
  };
};


const mapDispatchToProps = (dispatch) => {
  console.log('Browser mapDispatchToProps', dispatch);

  return {};
};


const Browser = connect(mapStateToProps, mapDispatchToProps)(browser);

export default Browser;
