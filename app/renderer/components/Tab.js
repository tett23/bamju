/* eslint react/no-danger: 0 */
// @flow

import { ipcRenderer, remote } from 'electron';
import * as React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { connect } from 'react-redux';
import type { BrowserState } from '../reducers/browser';
import type { Buffer } from '../../common/project';
import styles from './Browser.css';

const { Menu, MenuItem } = remote.require('electron');

const tabDefault = {
  name: '',
  projectName: '',
  path: '',
  absolutePath: '',
  body: ''
};

const tab = ({
  name, projectName, path, absolutePath, body
}: Buffer = tabDefault) => {
  console.log('refresh tab', body);

  const breadcrumbItems = [];
  breadcrumbItems.push((
    <Breadcrumb.Item
      key="/"
      onClick={e => { return breadcrumbItemsOnClick(e, projectName, '/'); }}
    >
      {projectName}
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
        key={item}
        onClick={e => { return breadcrumbItemsOnClick(e, projectName, p); }}
      >
        {item}
      </Breadcrumb.Item>
    ));
  });

  const html = {
    __html: body
  };

  return (
    <div className={styles.tab} data-absolute-path={absolutePath} onContextMenu={e => { return contextmenu(e, absolutePath); }}>
      <Breadcrumb>{breadcrumbItems}</Breadcrumb>
      <div className="markdown-body" name={name} dangerouslySetInnerHTML={html} />
    </div>
  );
};

function breadcrumbItemsOnClick(e, repo: string, path: string) {
  e.preventDefault();
  e.stopPropagation();

  ipcRenderer.send('open-page', { windowID: window.windowID, projectName: repo, itemName: path });
}

function contextmenu(e, absolutePath: string) {
  e.preventDefault();
  e.stopPropagation();

  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'edit on system editor',
    click: () => {
      ipcRenderer.send('open-by-editor', absolutePath);
    }
  }));

  menu.popup(remote.getCurrentWindow());
}

const mapStateToProps = (state: {browser: BrowserState}) => {
  console.log('Tab mapStateToProps', state);
  const t:?Buffer = state.browser.tabs[0];

  return t || tab.defaultProps;
};


const mapDispatchToProps = (dispatch) => {
  console.log('Tab mapDispatchToProps', dispatch);

  return {};
};


const Tab = connect(mapStateToProps, mapDispatchToProps)(tab);

export default Tab;
