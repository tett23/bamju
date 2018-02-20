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
  isSimilarFile,
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
  buffer: Buffer,
  content: string
} & $ReturnType<typeof mapDispatchToProps>;

function tab(props: Props) {
  const {
    name, repositoryName, path: itemPath, absolutePath
  } = props.buffer;

  const breadcrumbItems = [];
  breadcrumbItems.push((
    <Breadcrumb.Item
      key="/"
      onClick={e => { return breadcrumbItemsOnClick(e, repositoryName, '/'); }}
    >
      {repositoryName}
    </Breadcrumb.Item>
  ));

  let breadcrumbPath:string = '';
  path.split(itemPath).forEach((item: string) => {
    if (item === '') {
      return;
    }
    breadcrumbPath += `/${item}`;

    const p = breadcrumbPath;
    breadcrumbItems.push((
      <Breadcrumb.Item
        key={breadcrumbPath}
        onClick={e => { return breadcrumbItemsOnClick(e, repositoryName, p); }}
      >
        {item}
      </Breadcrumb.Item>
    ));
  });

  const html = {
    __html: props.content
  };

  return (
    <div
      className={styles.tab}
      data-absolute-path={absolutePath}
      onContextMenu={e => {
        return contextmenu(e, props.buffer);
      }}
    >
      <Breadcrumb>{breadcrumbItems}</Breadcrumb>
      <div className="markdown-body" name={name} dangerouslySetInnerHTML={html} />
    </div>
  );
}

function breadcrumbItemsOnClick(e, repo: string, itemPath: string) {
  e.preventDefault();
  e.stopPropagation();

  ipcRenderer.send('open-page', { windowID: window.windowID, repositoryName: repo, itemName: itemPath });
}

export function buildTabContextMenu(buf: Buffer) {
  return [
    {
      label: 'edit on system editor',
      click: () => {
        ipcRenderer.send('open-by-system-editor', buf.absolutePath);
      }
    },
    {
      label: 'edit on bamju editor',
      click: () => {
        ipcRenderer.send('open-by-bamju-editor', {
          parentWindowID: window.windowID,
          metaDataID: buf.id,
        });
      },
      enabled: isSimilarFile(buf.itemType)
    },
    {
      label: 'reload',
      click: () => {
        ipcRenderer.send('open-page', {
          windowID: window.windowID,
          repositoryName: buf.repositoryName,
          itemName: buf.path,
        });
      }
    }
  ];
}

function contextmenu(e, buf: Buffer) {
  e.preventDefault();
  e.stopPropagation();

  const template = buildTabContextMenu(buf);
  const menu = remote.require('electron').Menu.buildFromTemplate(template);

  menu.popup(remote.getCurrentWindow());
}

function mapDispatchToProps(_) {
  return {};
}


export const Tab = connect(null, mapDispatchToProps)(tab);
