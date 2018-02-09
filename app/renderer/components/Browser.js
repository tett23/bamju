// @flow

import React from 'react';
import { connect } from 'react-redux';
import type { BrowserState } from '../reducers/browser';
import Tab from './Tab';
import { initialBrowserState } from '../reducers/browser';
import styles from './Browser.css';

const browser = ({ tabs }: BrowserState = initialBrowserState()) => {
  console.log('refresh browser', tabs);

  const tab = tabs[0];

  console.log('refresh browser2', tab);

  return (
    <div className={styles.browser}>
      <Tab
        className={styles.tab}
        buffer={tab.buffer}
        content={tab.content}
      />
    </div>
  );
};

const mapStateToProps = (state: {browser: BrowserState}) => {
  return state.browser;
};


const mapDispatchToProps = (_) => {
  return {};
};


const Browser = connect(mapStateToProps, mapDispatchToProps)(browser);

export default Browser;
