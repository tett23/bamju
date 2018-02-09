/* eslint no-underscore-dangle: 0, no-param-reassign: 0, class-methods-use-this: 0 */
// @flow

import {
  ipcMain,
} from 'electron';
import {
} from '../menu';
import {
  getInstance,
} from '../common/repository_manager';
import {
  internalPath,
} from '../common/metadata';
import {
  type Buffer,
} from '../common/buffer';
import {
  MessageTypeSucceeded,
  MessageTypeFailed,
} from '../common/util';
import {
  Config,
  type Window as WindowConfig,
  findWindowConfig,
} from '../common/bamju_config';
import {
  createWindowID,
} from '../common/window';
import {
  getInstance as getWindowManagerInstance
} from '../common/window_manager';

ipcMain.on('open-new-window', async (e, { windowID, projectName, itemName }: {windowID: string, projectName: string, itemName: string}) => {
  console.log('open-new-window', projectName, itemName);

  let conf:?WindowConfig = findWindowConfig(windowID);
  if (conf === null || conf === undefined) {
    conf = Object.assign({}, Config.windows[0]);
  }

  conf.id = createWindowID();
  conf.rectangle.x += 50;
  conf.rectangle.y += 50;
  conf.tabs = [{
    buffer: {
      projectName,
      path: itemName
    }
  }];

  getWindowManagerInstance().createAppWindow(conf);
});

ipcMain.on('open-by-bamju-editor', async (e, fileInfo: {parentWindowID: ?string, projectName: string, itemName: string}) => {
  console.log('open-by-bamju-editor', fileInfo);

  const metaData = getInstance().detect(fileInfo.projectName, fileInfo.itemName);
  if (metaData == null) {
    e.send('show-information', {
      type: 'error',
      message: `file not found. projectName${internalPath(fileInfo.projectName, fileInfo.itemName)}`
    });

    return;
  }

  const editorWindow = getWindowManagerInstance().getEditorWindow(fileInfo.projectName, fileInfo.itemName);
  if (editorWindow == null) {
    getWindowManagerInstance().createEditorWindow(metaData, fileInfo.parentWindowID);
  } else {
    editorWindow.focus();
  }
});

ipcMain.on('save-buffer', async (e, { buffer, content }: {buffer: Buffer, content: string}) => {
  console.log('save-buffer', buffer);

  const repo = getInstance().find(buffer.repositoryName);
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
