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
    id, name, repositoryName, path, note
  } = (props.buffer || dummyBuffer());

  const tagItems = note.tags.map((item) => {
    return (
      <span
        className={styles.tagItem}
        key={id + item}
      >
        {item}
      </span>
    );
  });
  const keywordItems = note.keywords.map((item) => {
    return (
      <span
        className={styles.keywordItems}
        key={id + item}
      >
        {item}
      </span>
    );
  });

  return (
    <div className={styles.metaDataView}>
      <div className={styles.menu} />
      <div className={styles.fileName}>
        <p>{name}</p>
      </div>
      <div className={styles.outline}>
        <textarea>{note.outline}</textarea>
      </div>
      <dl className={styles.generalMetaData}>
        <dt>metaDataID</dt>
        <dd>{id}</dd>
        <dt>internalPath</dt>
        <dd>{internalPath(repositoryName, path)}</dd>
      </dl>
      <dl className={styles.notePanel}>
        <dt>tags</dt>
        <dd>{tagItems}</dd>
        <dt>keywords</dt>
        <dd>{keywordItems}</dd>
        <dt>status</dt>
        <dd>{note.status}</dd>
        <dt>label</dt>
        <dd>{note.label}</dd>
      </dl>
      <div className={styles.note}>
        <p>Note</p>
        <textarea>{note.note}</textarea>
      </div>
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
