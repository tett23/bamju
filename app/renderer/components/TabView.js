// @flow

import React from 'react';
import { connect } from 'react-redux';
import FontAwesome from 'react-fontawesome';
import {
  type BrowserState
} from '../../reducers/browser';
import {
  type BuffersState
} from '../../reducers/buffers';
import {
  activeTab,
  closeTab,
} from '../../actions/browser';
import styles from './TabView.css';

type Props = {
  browser: BrowserState,
  buffers: BuffersState
} & {
  dispatch: (any) => any // eslint-disable-line
};

function tabView(props: Props) {
  const tabItems = props.browser.tabs.map((item) => {
    const buf = props.buffers.find((b) => {
      return b.id === item.metaDataID;
    });
    const title = buf ? buf.name : '(untitled)';
    const isActive = (item.id === props.browser.currentTabID);
    const activeClass = isActive ? styles.active : styles.inactive;
    const itemClass = [styles.tabItem, activeClass].join(' ');

    return (
      <li
        className={itemClass}
        role="none"
        onClick={() => { props.dispatch(activeTab(item.id)); }}
      >
        <span className={styles.tabTitle}>{title}</span>
        <FontAwesome className={styles.closeIcon} name="times" onClick={() => { props.dispatch(closeTab(item.id)); }} />
      </li>
    );
  });

  return (
    <ul className={styles.tabView}>
      {tabItems}
    </ul>
  );
}

export const TabView = connect()(tabView);

export default TabView;
