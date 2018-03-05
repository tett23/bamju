/* eslint react/no-unused-prop-types: 0 */
// @flow

import * as React from 'react';
import { connect } from 'react-redux';
// $FlowFixMe
import VNode from 'virtual-dom/vnode/vnode';
// $FlowFixMe
import VText from 'virtual-dom/vnode/vtext';

import path from '../../common/path';

import {
  parseMetaData,
} from '../../actions/parser';
import {
  newEditorWindow,
} from '../../actions/windows';
import {
  type MetaDataID,
  type PathInfo,
  resolveInternalPath,
} from '../../common/metadata';
import {
  type Buffer
} from '../../common/buffer';
import { ContextMenu } from '../contextmenu';
import FileHeader from './FileHeader';
import styles from './Browser.css';

const convertHTML = require('html-to-vdom')({
  VNode,
  VText
});

type Props = {
  id: string,
  buffer: ?Buffer,
  content: string
} & {
  parseMetaData: (string, MetaDataID) => any, // eslint-disable-line flowtype/no-weak-types
  newEditorWindow: (MetaDataID) => any // eslint-disable-line flowtype/no-weak-types
};

function tab(props: Props) {
  const md = convert(props.buffer, convertHTML(`<div>${props.content}</div>`));

  return (
    <div
      className={styles.tab}
      onContextMenu={e => {
        return contextmenu(e, props.buffer);
      }}
    >
      <FileHeader buffer={props.buffer} tabID={props.id} isEdited={false} />
      <div className={styles.tabInner}>
        <div className="markdown-body">{md}</div>
      </div>
    </div>
  );
}

function convert(buffer: ?Buffer, tree: VNode | VText) {
  if (tree instanceof VNode) {
    let attributes;
    if (tree.properties.attributes.class === 'bamjuLink') {
      attributes = convertBamjuLink(buffer, tree.properties.attributes);
    } else {
      attributes = tree.properties.attributes;
    }

    let children = [];
    if (tree.children && tree.children.length !== 0) {
      children = tree.children.map((item) => {
        return convert(buffer, item);
      }).filter(Boolean);
    }
    if (children.length === 0) {
      children = null;
    }

    return React.createElement(tree.tagName, attributes, children);
  }

  if (tree.text === '' || tree.text === '\n') {
    return null;
  }

  return tree.text;
}

function convertBamjuLink(buf: ?Buffer, attributes) {
  const ret = attributes;
  ret.className = 'wikiLink';
  delete ret.class;

  const pathInfo = resolveInternalPath(ret['data-internal-path']);
  if (pathInfo.repositoryName == null && buf) {
    pathInfo.repositoryName = buf.repositoryName;
  }

  if (ret['data-is-exist'] === 'true') {
    ret.className = 'wikiLink available';
    ret.onClick = () => {
      window.wikiLinkOnClickAvailable(pathInfo.repositoryName, pathInfo.path);
    };
    ret.onContextMenu = (e) => {
      return contextmenu(e, buf, pathInfo);
    };
  } else {
    ret.className = 'wikiLink unavailable';
    ret.onClick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const parentPath = buf ? buf.path : '/';
      if (!path.isAbsolute(pathInfo.path)) {
        pathInfo.path = path.join(path.dirname(parentPath), pathInfo.path);
      }
      if (path.extname(pathInfo.path) === '') {
        pathInfo.path += '.md';
      }

      window.wikiLinkOnClickUnAvailable(pathInfo.repositoryName, pathInfo.path);
    };
  }

  return ret;
}

function contextmenu(e, buffer: ?Buffer, pathInfo?: PathInfo) {
  e.preventDefault();
  e.stopPropagation();

  if (buffer == null) {
    return;
  }

  new ContextMenu({ buffer, pathInfo }).show();
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
