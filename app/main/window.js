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
import * as Message from '../common/message';
import * as dispatcher from './event_dispatcher';
import { addMessage } from '../actions/messages';
import { bufferContentUpdated } from '../actions/buffers';

ipcMain.on('save-buffer', async (e, [metaDataID, content]: [MetaDataID, string]) => {
  console.log('save-buffer', metaDataID, content);

  const metaData = getRepositoryManagerInstance().getItemByID(metaDataID);
  if (metaData == null) {
    const mes = Message.fail(`save-buffer error: metaData not found metaDataID=${metaDataID}`);
    dispatcher.dispatch(addMessage(mes));
    e.sender.send('message', mes);
    e.returnValue = null;
    return;
  }

  const message = await metaData.updateContent(content);
  if (Message.isSimilarError(message)) {
    dispatcher.dispatch(addMessage(Message.wrap(message)));
    e.returnValue = null;
  }

  e.sender.send('buffer-saved', message);
  e.returnValue = message;

  const [parseResult, parseMessage] = await metaData.parse();
  if (parseResult == null || Message.isSimilarError(parseMessage)) {
    dispatcher.dispatch(addMessage(Message.wrap(parseMessage)));
    e.returnValue = null;
    return;
  }

  dispatcher.dispatch(bufferContentUpdated(metaData.id, parseResult.content));
});
