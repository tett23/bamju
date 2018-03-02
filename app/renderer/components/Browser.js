// @flow

import React from 'react';
import { connect } from 'react-redux';
import type { State } from '../../reducers/app_window';
import { Tab } from './Tab';
import { addTab } from '../../actions/browser';
import {
  type $ReturnType,
} from '../../common/util';
import styles from './Browser.css';

type Props = $ReturnType<typeof mapStateToProps> & $ReturnType<typeof mapDispatchToProps>;

const browser = (props: Props) => {
  const tabs = props.browser.tabs.map((item) => {
    const buf = props.buffers.find((b) => {
      return b.id === item.metaDataID;
    });

    return (
      <Tab
        className={styles.tab}
        key={item.id}
        id={item.id}
        buffer={buf}
        content={item.content}
      />
    );
  });

  return (
    <div className={styles.browser}>
      {tabs}
    </div>
  );
};

function mapStateToProps(state: State) {
  const browserState = state.browser;
  if (browserState.tabs.length === 0) {
    const tab = addTab(null, '');
    browserState.tabs = [tab.payload];
    browserState.currentTabID = tab.payload.id;
  }

  return {
    browser: browserState,
    buffers: state.global.buffers
  };
}


function mapDispatchToProps(_) {
  return {};
}


const Browser = connect(mapStateToProps, mapDispatchToProps)(browser);

export default Browser;
