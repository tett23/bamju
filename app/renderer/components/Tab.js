/* eslint react/no-danger: 0 */
// @flow

import { ipcRenderer, remote } from 'electron';
import * as React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { connect } from 'react-redux';
import type { mainViewState } from '../reducers/main_view';
import type { Buffer } from '../../common/project';
import styles from './Browser.css';

const { Menu, MenuItem } = remote.require('electron');
const { PropTypes } = React;

const tab = ({
  name, projectName, path, absolutePath, body
}) => {
  console.log('refresh tab', body);

  const split:Array<string> = (projectName + path).split('/');
  const breadcrumbItems = [];
  split.forEach((item: string) => {
    if (item === '') {
      return;
    }

    breadcrumbItems.push(<Breadcrumb.Item key={item}>{item}</Breadcrumb.Item>);
  });

  const html = {
    __html: body
  };

  return (
    <div className={styles.tab} data-absolute-path={absolutePath} onContextMenu={e => contextmenu(e, absolutePath)}>
      <Breadcrumb>{breadcrumbItems}</Breadcrumb>
      <div name={name} dangerouslySetInnerHTML={html} />
    </div>
  );
};

function contextmenu(e, absolutePath: string) {
  e.preventDefault();

  const menu = new Menu();
  menu.append(new MenuItem({
    label: 'open',
    click: () => {
      ipcRenderer.send('open-by-editor', absolutePath);
    }
  }));

  menu.popup(remote.getCurrentWindow());
}

tab.defaultProps = {
  name: '',
  projectName: '',
  path: '',
  absolutePath: '',
  body: ''
};

tab.propTypes = {
  name: PropTypes.string,
  projectName: PropTypes.string,
  path: PropTypes.string,
  absolutePath: PropTypes.string,
  body: PropTypes.string
};

const mapStateToProps = (state: {mainView: mainViewState}) => {
  console.log('Tab mapStateToProps', state);
  const t:?Buffer = state.mainView.browser.tabs[0];

  return t || tab.defaultProps;
};


const mapDispatchToProps = (dispatch) => {
  console.log('Tab mapDispatchToProps', dispatch);

  return {};
};


const Tab = connect(mapStateToProps, mapDispatchToProps)(tab);

export default Tab;
