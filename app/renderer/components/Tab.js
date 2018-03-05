/* eslint react/no-danger: 0, react/no-unused-prop-types: 0 */
// @flow

import * as React from 'react';
import { connect } from 'react-redux';

import path from '../../common/path';

import {
  parseMetaData,
} from '../../actions/parser';
import {
  newEditorWindow,
} from '../../actions/windows';
import {
  type MetaDataID,
  internalPath,
  resolveInternalPath,
} from '../../common/metadata';
import {
  type Buffer
} from '../../common/buffer';
import { ContextMenu } from '../contextmenu';
import FileHeader from './FileHeader';
import styles from './Browser.css';

type Props = {
  id: string,
  buffer: ?Buffer,
  content: string
} & {
  parseMetaData: (string, MetaDataID) => any, // eslint-disable-line flowtype/no-weak-types
  newEditorWindow: (MetaDataID) => any // eslint-disable-line flowtype/no-weak-types
};

class tab extends React.Component<Props> {
  componentDidUpdate() {
    if (this.props.buffer) {
      onLoad(this.props.buffer);
    }
  }

  render() {
    const html = {
      __html: this.props.content
    };

    return (
      <div
        className={styles.tab}
        onContextMenu={e => {
          return contextmenu(e, this.props.buffer);
        }}
      >
        <FileHeader buffer={this.props.buffer} tabID={this.props.id} isEdited={false} />
        <div className={styles.tabInner}>
          <div className="markdown-body" dangerouslySetInnerHTML={html} />
        </div>
      </div>
    );
  }
}

function onLoad(buf: Buffer) {
  const links = document.querySelectorAll('.bamjuLink');
  links.forEach((item) => {
    item.classList.add('wikiLink');
    const repositoryName = item.dataset.repositoryName || buf.repositoryName;
    if (item.dataset.isExist === 'true') {
      item.classList.add('available');
      item.addEventListener('click', () => {
        window.wikiLinkOnClickAvailable(repositoryName, item.dataset.internalPath);
      });
    } else {
      item.classList.add('unavailable');
      item.addEventListener('click', () => {
        const pathInfo = resolveInternalPath(item.dataset.internalPath);
        if (pathInfo.repositoryName == null) {
          pathInfo.repositoryName = buf.repositoryName;
        }
        if (!path.isAbsolute(pathInfo.path)) {
          pathInfo.path = path.join(path.dirname(buf.path), pathInfo.path);
        }
        if (path.extname(pathInfo.path) === '') {
          pathInfo.path += '.md';
        }

        const internal = internalPath(pathInfo.repositoryName || '', pathInfo.path);

        window.wikiLinkOnClickUnAvailable(repositoryName, internal);
      });
    }
  });
}

function contextmenu(e, buffer: ?Buffer) {
  e.preventDefault();
  e.stopPropagation();

  if (buffer == null) {
    return;
  }

  new ContextMenu({ buffer }).show();
}

function mapDispatchToProps(dispatch) {
  return {
    parseMetaData: (tabID: string, metaDataID: MetaDataID) => {
      return dispatch(parseMetaData(tabID, metaDataID));
    },
    newEditorWindow: (metaDataID: MetaDataID) => {
      return dispatch(newEditorWindow(metaDataID));
    }
  };
}


export const Tab = connect(null, mapDispatchToProps)(tab);

export default Tab;
