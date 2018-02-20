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
  MessageTypeSucceeded,
  MessageTypeFailed,
} from '../common/util';
import {
  type WindowID,
} from '../common/window';
import {
  getInstance as getWindowManagerInstance
} from '../common/window_manager';

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

ipcMain.on('save-buffer', async (e, [metaDataID, content]: [MetaDataID, string]) => {
  console.log('save-buffer', metaDataID, content);

  const metaData = getRepositoryManagerInstance().getItemByID(metaDataID);
  if (metaData == null) {
    const mes = {
      type: MessageTypeFailed,
      message: `save-buffer error: metaData not found metaDataID=${metaDataID}`,
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const message = await metaData.updateContent(content);
  if (message.type !== MessageTypeSucceeded) {
    const mes = {
      type: MessageTypeFailed,
      message: `save-buffer updateContent error: ${message.message}`,
    };
    e.sender.send('message', mes);
    e.returnValue = null;
  }

  e.sender.send('buffer-saved', message);
  e.returnValue = message;

  const [parseResult, parseMessage] = await metaData.parse();
  if (parseResult == null || parseMessage.type !== MessageTypeSucceeded) {
    const mes = {
      type: MessageTypeFailed,
      message: `save-buffer metaData.parse error: ${parseMessage.message}`,
    };
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  getWindowManagerInstance().sendSavedEventAll(metaData.id, parseResult.content);
});
