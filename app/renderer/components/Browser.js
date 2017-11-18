// @flow

import React from 'react';
import { connect } from 'react-redux';
import type { mainViewState } from '../reducers/main_view';
import Tab from './Tab';
import type { Buffer } from '../../common/project';
import styles from './Browser.css';

const { PropTypes } = React;

const browser = ({ tabs }) => {
  console.log('refresh browser', tabs);
  console.log('refresh browser buf=', tabs[0].buf);

  const t:Buffer = tabs[0];

  return (
    <div className={styles.browser}>
      <Tab
        className={styles.tab}
        name={t.name}
        path={t.path}
        absolutePath={t.absolutePath}
        body={t.body}
      />
    </div>
  );
};

browser.defaultProps = {
  tabs: []
};

browser.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    path: PropTypes.string,
    absolutePath: PropTypes.string,
    buf: PropTypes.string
  }))
};

const mapStateToProps = (state: {mainView: mainViewState}) => {
  console.log('Browser mapStateToProps', state);

  const tabs = [];
  state.mainView.browser.tabs.forEach((tab: Buffer) => {
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
