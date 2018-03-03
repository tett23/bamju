/* eslint react/no-danger: 0, react/no-unused-prop-types: 0 */
// @flow

import {
  ipcRenderer,
  remote,
} from 'electron';
import * as React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { connect } from 'react-redux';

import path from '../../common/path';

import {
  parseMetaData,
  parseInternalPath,
} from '../../actions/parser';
import {
  newEditorWindow,
} from '../../actions/windows';
import {
  isSimilarFile,
  type MetaDataID,
  internalPath,
  resolveInternalPath,
} from '../../common/metadata';
import {
  type Buffer
} from '../../common/buffer';
import styles from './Browser.css';

type Props = {
  id: string,
  buffer: ?Buffer,
  content: string
} & {
  parseMetaData: (string, MetaDataID) => any, // eslint-disable-line flowtype/no-weak-types
  parseInternalPath: (string, string) => any, // eslint-disable-line flowtype/no-weak-types
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
          return contextmenu(e, this.props);
        }}
      >
        {buildBreadcrumbs(this.props.buffer, this.props)}
        <div className="markdown-body" dangerouslySetInnerHTML={html} />
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

function buildBreadcrumbs(buffer: ?Buffer, props: Props) {
  if (buffer == null) {
    return <Breadcrumb />;
  }

  const { repositoryName } = buffer;
  const items = [(
    <Breadcrumb.Item
      key="/"
      onClick={e => { return breadcrumbItemsOnClick(e, repositoryName, '/', props); }}
    >
      {repositoryName}
    </Breadcrumb.Item>
  )];

  let breadcrumbPath:string = '';
  path.split(buffer.path).forEach((item) => {
    if (item === '') {
      return;
    }
    breadcrumbPath += `/${item}`;

    const p = breadcrumbPath;
    items.push((
      <Breadcrumb.Item
        key={breadcrumbPath}
        onClick={e => { return breadcrumbItemsOnClick(e, repositoryName, p, props); }}
      >
        {item}
      </Breadcrumb.Item>
    ));
  });

  return (
    <Breadcrumb>
      {items}
    </Breadcrumb>
  );
}

function breadcrumbItemsOnClick(e, repo: string, itemPath: string, props: Props) {
  e.preventDefault();
  e.stopPropagation();

  props.parseInternalPath(props.id, internalPath(repo, itemPath));
}

export function buildTabContextMenu(props: Props) {
  if (props.buffer == null) {
    return [];
  }

  const buffer = props.buffer;

  return [
    {
      label: 'edit on system editor',
      click: () => {
        ipcRenderer.send('open-by-system-editor', buffer.absolutePath);
      }
    },
    {
      label: 'edit on bamju editor',
      click: () => {
        props.newEditorWindow(buffer.id);
      },
      enabled: isSimilarFile(buffer.itemType)
    },
    {
      label: 'reload',
      click: () => {
        props.parseMetaData(props.id, buffer.id);
      }
    }
  ];
}

function contextmenu(e, props: Props) {
  e.preventDefault();
  e.stopPropagation();

  if (props.buffer == null) {
    return;
  }

  const template = buildTabContextMenu(props);
  const menu = remote.require('electron').Menu.buildFromTemplate(template);

  menu.popup(remote.getCurrentWindow());
}

function mapDispatchToProps(dispatch) {
  return {
    parseMetaData: (tabID: string, metaDataID: MetaDataID) => {
      return dispatch(parseMetaData(tabID, metaDataID));
    },
    parseInternalPath: (tabID: string, _internalPath: string) => {
      return dispatch(parseInternalPath(tabID, _internalPath));
    },
    newEditorWindow: (metaDataID: MetaDataID) => {
      return dispatch(newEditorWindow(metaDataID));
    }
  };
}


export const Tab = connect(null, mapDispatchToProps)(tab);
