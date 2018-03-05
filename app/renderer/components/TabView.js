// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  type BrowserState
} from '../../reducers/browser';
import {
  type BuffersState
} from '../../reducers/buffers';
import {
  type $ReturnType,
} from '../../common/util';
import styles from './TabView.css';

type Props = {
  browser: BrowserState,
  buffers: BuffersState
} & $ReturnType<typeof mapDispatchToProps>;

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
      <li className={itemClass}>
        <span className={styles.tabTitle}>{title}aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</span>
      </li>
    );
  });

  return (
    <ul className={styles.tabView}>
      {tabItems}
    </ul>
  );
}

function mapDispatchToProps(_) {
  return {};
}

export const TabView = connect(null, mapDispatchToProps)(tabView);

export default TabView;
