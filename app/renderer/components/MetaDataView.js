// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import type { State } from '../../reducers/app_window';
import {
  dummyBuffer,
} from '../../common/buffer';
import {
  internalPath,
} from '../../common/metadata';
import {
  type $ReturnType,
} from '../../common/util';
import styles from './MetaDataView.css';

type Props = $ReturnType<typeof mapStateToProps> & $ReturnType<typeof mapDispatchToProps>;

export function metaDataView(props: Props) {
  const {
    id, name, repositoryName, path
  } = (props.buffer || dummyBuffer());

  return (
    <div className={styles.metaDataView}>
      <div className={styles.menu} />
      <div className={styles.fileName}>
        {name}
      </div>
      <dl className={styles.generalMetaData}>
        <dt>metaDataID</dt>
        <dd>{id}</dd>
        <dt>internalPath</dt>
        <dd>{internalPath(repositoryName, path)}</dd>
      </dl>
    </div>
  );
}

function mapStateToProps(state: State) {
  const currentTabID = state.browser.currentTabID;
  const tab = state.browser.tabs.find((item) => {
    return item.id === currentTabID;
  });
  if (tab == null) {
    return {
      buffer: null
    };
  }

  const buffer = state.global.buffers.find((item) => {
    return item.id === tab.metaDataID;
  });

  return {
    buffer
  };
}

function mapDispatchToProps(_) {
  return {
  };
}


export const MetaDataView = connect(mapStateToProps, mapDispatchToProps)(metaDataView);

export default MetaDataView;
