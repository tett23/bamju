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
  openInputDialog,
} from '../../actions/modals';
import {
  createFile,
} from '../../actions/repositories';
import {
  type MetaDataID,
  type PathInfo,
  internalPath,
  resolveInternalPath,
} from '../../common/metadata';
import {
  type Buffer
} from '../../common/buffer';
import {
  type $ReturnType,
} from '../../common/util';
import { ContextMenu } from '../contextmenu';
import styles from './Browser.css';

const convertHTML = require('html-to-vdom')({
  VNode,
  VText
});

type Props = {
  id: string,
  buffer: ?Buffer,
  content: string
} & $ReturnType<typeof mapDispatchToProps>;

function tab(props: Props) {
  const md = convert(props.buffer, props.id, convertHTML(`<div>${props.content}</div>`), props);

  return (
    <div
      className={styles.tab}
      onContextMenu={e => {
        return contextmenu(e, {
          buffer: props.buffer
        });
      }}
    >
      <div className={styles.tabInner}>
        <div className="markdown-body">{md}</div>
      </div>
    </div>
  );
}

function convert(buffer: ?Buffer, tabID: string, tree: VNode | VText, dispatcher) {
  if (tree instanceof VNode) {
    let attributes;
    if (tree.properties.attributes.class === 'bamjuLink') {
      attributes = convertBamjuLink(buffer, tabID, tree.properties.attributes, dispatcher);
    } else {
      attributes = tree.properties.attributes;
    }

    let children = [];
    if (tree.children && tree.children.length !== 0) {
      children = tree.children.map((item) => {
        return convert(buffer, tabID, item, dispatcher);
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

function convertBamjuLink(buf: ?Buffer, tabID: string, attributes, dispatcher) {
  const ret = attributes;
  ret.className = 'wikiLink';
  delete ret.class;

  const pathInfo = resolveInternalPath(ret['data-internal-path']);
  if (pathInfo.repositoryName == null && buf) {
    pathInfo.repositoryName = buf.repositoryName;
  }

  if (ret['data-is-exist'] === 'true') {
    ret.className = 'wikiLink available';
    const metaDataID = ret['data-meta-data-id'];
    ret.onClick = () => {
      dispatcher.parseMetaData(tabID, metaDataID);
    };
    ret.onContextMenu = (e) => {
      return contextmenu(e, {
        buffer: buf,
        linkMetaDataID: metaDataID,
      });
    };
  } else {
    ret.className = 'wikiLink unavailable';

    const parentPath = buf ? buf.path : '/';
    if (!path.isAbsolute(pathInfo.path)) {
      pathInfo.path = path.join(path.dirname(parentPath), pathInfo.path);
    }
    if (path.extname(pathInfo.path) === '') {
      pathInfo.path += '.md';
    }
    ret.onClick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      dispatcher.wikiLinkUnavailable(pathInfo);
    };
    ret.onContextMenu = (e) => {
      return contextmenu(e, {
        buffer: buf,
        enableCreateMenu: true,
        newFilePathInfo: pathInfo
      });
    };
  }

  return ret;
}

function contextmenu(e, options: {
  buffer: ?Buffer,
  metaDataID?: MetaDataID,
  enableCreateMenu?: boolean,
  newFilePathInfo?: PathInfo
}) {
  e.preventDefault();
  e.stopPropagation();

  if (options.buffer == null) {
    return;
  }

  new ContextMenu({
    buffer: options.buffer,
    linkMetaDataID: options.metaDataID,
    enableCreateMenu: options.enableCreateMenu,
    newFilePathInfo: options.newFilePathInfo,
  }).show();
}

function mapDispatchToProps(dispatch) {
  return {
    parseMetaData: (tabID: string, metaDataID: MetaDataID) => {
      return dispatch(parseMetaData(tabID, metaDataID));
    },
    newEditorWindow: (metaDataID: MetaDataID) => {
      return dispatch(newEditorWindow(metaDataID));
    },
    wikiLinkUnavailable: (pathInfo: PathInfo) => {
      return dispatch(openInputDialog({
        label: 'new file',
        formValue: internalPath(pathInfo.repositoryName || '', pathInfo.path),
        placeholder: 'input file name',
        onEnter: (itemPath) => {
          dispatch(createFile(pathInfo.repositoryName || '', itemPath));
        }
      }));
    }
  };
}


export const Tab = connect(null, mapDispatchToProps)(tab);

export default Tab;
