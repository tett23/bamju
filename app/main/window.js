/* eslint no-underscore-dangle: 0, no-param-reassign: 0, class-methods-use-this: 0 */
// @flow

import {
  ipcMain,
} from 'electron';
import {
} from '../menu';
import {
  getInstance as getRepositoryManagerInstance,
} from '../common/repository_manager';
import {
  type MetaDataID,
} from '../common/metadata';
import {
  type Buffer,
} from '../common/buffer';
import {
  MessageTypeSucceeded,
  MessageTypeFailed,
} from '../common/util';
import {
  getInstance as getConfigInstance
} from '../common/bamju_config';
import {
  createWindowID,
  type WindowID,
} from '../common/window';
import {
  getInstance as getWindowManagerInstance
} from '../common/window_manager';

ipcMain.on('open-new-window', async (e, { windowID, metaDataID }: {windowID: WindowID, metaDataID: MetaDataID}) => {
  console.log('open-new-window', windowID, metaDataID);

  let conf = getConfigInstance().findWindowConfig(windowID);
  if (conf == null) {
    conf = Object.assign({}, getConfigInstance().getConfig().windows[0]);
  }

  const metaData = getRepositoryManagerInstance().getItemByID(metaDataID);
  if (metaData == null) {
    return;
  }

  conf.id = createWindowID();
  conf.rectangle.x += 50;
  conf.rectangle.y += 50;
  conf.tabs = [{
    buffer: metaData.toBuffer(),
    content: '',
  }];

  getWindowManagerInstance().createAppWindow(conf);
});

ipcMain.on('open-by-bamju-editor', async (e, { parentWindowID, metaDataID }: {parentWindowID: ?WindowID, metaDataID: MetaDataID}) => {
  console.log('open-by-bamju-editor', parentWindowID, metaDataID);

  const metaData = getRepositoryManagerInstance().getItemByID(metaDataID);
  if (metaData == null) {
    e.send('message', {
      type: MessageTypeFailed,
      message: `file not found. metaDataID=${metaDataID}`
    });

    return;
  }

  const editorWindow = getWindowManagerInstance().getEditorWindow(metaDataID);
  if (editorWindow == null) {
    getWindowManagerInstance().createEditorWindow(metaData, parentWindowID);
  } else {
    editorWindow.focus();
  }
});

ipcMain.on('save-buffer', async (e, { buffer, content }: {buffer: Buffer, content: string}) => {
  console.log('save-buffer', buffer);

  const repo = getRepositoryManagerInstance().find(buffer.repositoryName);
  if (repo == null) {
    const mes = {
      type: MessageTypeFailed,
      message: 'save-buffer error',
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const metaData = repo.getItemByPath(buffer.path);
  if (metaData == null) {
    const mes = {
      type: MessageTypeFailed,
      message: 'save-buffer error',
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const message = await metaData.updateContent(content);
  if (message.type !== MessageTypeSucceeded) {
    const mes = {
      type: MessageTypeFailed,
      message: `save-buffer error: ${message.message}`,
    };
    e.sender.send('message', mes);
    e.returnValue = null;
  }

  e.sender.send('buffer-saved', message);
  e.returnValue = message;

  const [parseResult, parseMessage] = await metaData.parse();
  if (parseResult == null || parseMessage !== MessageTypeSucceeded) {
    const mes = {
      type: MessageTypeFailed,
      message: `save-buffer error: ${parseMessage.message}`,
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const buf = metaData.toBuffer();
  getWindowManagerInstance().sendSavedEventAll(buf, parseResult.content);
});
