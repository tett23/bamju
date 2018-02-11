/* eslint react/no-danger: 0 */
// @flow

import 'raf/polyfill';

import {
  ipcRenderer,
  remote,
  Menu,
  MenuItem,
} from 'electron';
import * as React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { connect } from 'react-redux';
import {
  type BrowserState,
  tabDefault,
} from '../reducers/browser';
import {
  ItemTypeMarkdown,
  ItemTypeText,
} from '../../common/metadata';
import {
  type Buffer
} from '../../common/buffer';
import styles from './Browser.css';

function tab({ buffer, content }: {buffer: Buffer, content: string} = tabDefault()) {
  console.log('aaaaa');
  console.log('tab', buffer, content);
  const {
    name, repositoryName, path, absolutePath
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
  path.split('/').forEach((item: string) => {
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
    <div className={styles.tab} data-absolute-path={absolutePath} onContextMenu={e => { return contextmenu(e, buffer); }}>
      <Breadcrumb>{breadcrumbItems}</Breadcrumb>
      <div className="markdown-body" name={name} dangerouslySetInnerHTML={html} />
    </div>
  );
}

function breadcrumbItemsOnClick(e, repo: string, path: string) {
  e.preventDefault();
  e.stopPropagation();

  ipcRenderer.send('open-page', { windowID: window.windowID, repositoryName: repo, itemName: path });
}

function contextmenu(e, buf: Buffer) {
  e.preventDefault();
  e.stopPropagation();

  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'edit on system editor',
    click: () => {
      ipcRenderer.send('open-by-system-editor', buf.absolutePath);
    }
  }));
  menu.append(new MenuItem({
    label: 'edit on bamju editor',
    click: () => {
      ipcRenderer.send('open-by-bamju-editor', {
        parentWindowID: window.windowID,
        repositoryName: buf.repositoryName,
        itemName: buf.path
      });
    },
    enabled: buf.itemType === ItemTypeMarkdown || buf.itemType === ItemTypeText
  }));
  menu.append(new MenuItem({
    label: 'reload',
    click: () => {
      ipcRenderer.send('open-page', {
        windowID: window.windowID,
        repositoryName: buf.repositoryName,
        itemName: buf.path,
      });
    }
  }));

  menu.popup(remote.getCurrentWindow());
}

const mapStateToProps = (state: {browser: BrowserState}) => {
  return state.browser.tabs[0] || tabDefault();
};


const mapDispatchToProps = (_) => {
  return {};
};


const Tab = connect(mapStateToProps, mapDispatchToProps)(tab);

export default Tab;
