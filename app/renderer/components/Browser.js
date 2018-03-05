// @flow

import React from 'react';
import { connect } from 'react-redux';
import type { State } from '../../reducers/app_window';
import { TabView } from './TabView';
import { Tab } from './Tab';
import {
  type $ReturnType,
} from '../../common/util';
import styles from './Browser.css';

type Props = $ReturnType<typeof mapStateToProps> & $ReturnType<typeof mapDispatchToProps>;

const browser = (props: Props) => {
  let tab = props.browser.tabs.find((item) => {
    return item.id === props.browser.currentTabID;
  });
  if (tab == null) {
    tab = {
      id: '',
      metaDataID: null,
      content: '',
    };
  }
  const buffer = props.buffers.find((item) => {
    return item.id === tab.metaDataID;
  });

  return (
    <div className={styles.browser}>
      <TabView browser={props.browser} buffers={props.buffers} />
      <Tab
        id={tab.id}
        buffer={buffer}
        content={tab.content}
      />
    </div>
  );
};

function mapStateToProps(state: State) {
  return {
    browser: state.browser,
    buffers: state.global.buffers
  };
}


function mapDispatchToProps(_) {
  return {};
}


const Browser = connect(mapStateToProps, mapDispatchToProps)(browser);

export default Browser;
