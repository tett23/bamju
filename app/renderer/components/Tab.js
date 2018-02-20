/* eslint react/no-danger: 0 */
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
  isSimilarFile,
  type MetaDataID,
  internalPath,
} from '../../common/metadata';
import {
  type Buffer
} from '../../common/buffer';
import {
  type $ReturnType,
} from '../../common/util';
import styles from './Browser.css';

type Props = {
  id: string,
  buffer: ?Buffer,
  content: string
} & $ReturnType<typeof mapDispatchToProps>;

function tab(props: Props) {
  const html = {
    __html: props.content
  };

  return (
    <div
      className={styles.tab}
      onContextMenu={e => {
        return contextmenu(e, props);
      }}
    >
      {buildBreadcrumbs(props.buffer, props)}
      <div className="markdown-body" dangerouslySetInnerHTML={html} />
    </div>
  );
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
        ipcRenderer.send('open-by-bamju-editor', {
          parentWindowID: window.windowID,
          metaDataID: buffer.id,
        });
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
    }
  };
}


export const Tab = connect(null, mapDispatchToProps)(tab);
