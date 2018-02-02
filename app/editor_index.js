// @flow
/* eslint disable-line: 0, global-require:0 */

import path from 'path';
import React from 'react';
import { createStore } from 'redux';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { ipcRenderer } from 'electron';
import EditorRoot from './renderer/containers/EditorRoot';
import { appReducer } from './renderer/reducers/combined';
import { openPageByBuffer } from './renderer/actions/tab';
import {
  type Buffer
} from './common/project';
import './app.global.css';

const store = createStore(
  appReducer,
  undefined,
);

const root = document.getElementById('root');
if (root != null) {
  render(
    <AppContainer>
      <EditorRoot store={store} />
    </AppContainer>,
    root
  );
}

ipcRenderer.on('initialize', (event, buf: Buffer) => {
  (async () => {
    await Project.Manager.init();

    window.windowID = conf.id;

    const projectName:string = conf.tabs[0].buffer.projectName || '';
    const itemName:string = conf.tabs[0].buffer.path || '';

    ipcRenderer.sendSync('refresh-tree-view');
    ipcRenderer.send('open-page', { windowID: window.windowID, projectName, itemName });
  })();
});
