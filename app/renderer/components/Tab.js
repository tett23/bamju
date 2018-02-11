/* eslint react/no-danger: 0 */
// @flow

import {
  ipcRenderer,
  remote,
  Menu,
} from 'electron';
import * as React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { connect } from 'react-redux';

import path from '../../common/path';

import {
  type BrowserState,
  tabDefault,
} from '../reducers/browser';
import {
  isSimilarFile,
} from '../../common/metadata';
import {
  type Buffer
} from '../../common/buffer';
import styles from './Browser.css';

type Props = {
  buffer: Buffer,
  content: string
};

function tab({ buffer, content }: {
  buffer: Buffer,
  content: string
} = tabDefault()) {
  const {
    name, repositoryName, path: itemPath, absolutePath
  } = buffer;

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
    __html: content
  };

  return (
    <div
      className={styles.tab}
      data-absolute-path={absolutePath}
      onContextMenu={e => {
        return contextmenu(e, buffer);
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
          repositoryName: buf.repositoryName,
          itemName: buf.path
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

  const menu = Menu.buildFromTemplate(buildTabContextMenu(buf));

  menu.popup(remote.getCurrentWindow());
}

const mapStateToProps = (state: {browser: BrowserState}): Props => {
  return state.browser.tabs[0] || tabDefault();
};

const mapDispatchToProps = (_) => {
  return {
    buildTabContextMenu,
  };
};


export const Tab = connect(mapStateToProps, mapDispatchToProps)(tab);
