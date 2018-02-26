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
} from '../common/message';
import {
  getInstance as getWindowManagerInstance
} from '../common/window_manager';

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
