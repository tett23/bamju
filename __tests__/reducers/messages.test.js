// @flow

import { createStore } from 'redux';

import {
  initialMessagesState,
  messages,
} from '../../app/reducers/messages';
import {
  addMessage,
  closeMessage,
  closeAllMessages,
} from '../../app/actions/messages';
import {
  MessageTypeInfo,
} from '../../app/common/util';

let store;
beforeEach(() => {
  store = createStore(messages, initialMessagesState());
});

describe('messages reducer', () => {
  describe('ADD_MESSAGE', () => {
    it('バッファを開くことができる', () => {
      expect(store.getState().length).toBe(0);

      const message = store.dispatch(addMessage({
        type: MessageTypeInfo,
        message: 'add message'
      }));

      const newState = store.getState();
      expect(newState.length).toBe(1);
      expect(newState[0].id).toBe(message.payload.id);
      expect(newState[0].message).toMatchObject(message.payload.message);
    });
  });

  describe('CLOSE_MESSAGE', () => {
    it('Messageの削除ができる', () => {
      const message = store.dispatch(addMessage({
        type: MessageTypeInfo,
        message: 'add message'
      }));
      expect(store.getState().length).toBe(1);

      store.dispatch(closeMessage(message.payload.id));

      expect(store.getState().length).toBe(0);
    });
  });

  describe('CLOSE_ALL_MESSAGES', () => {
    it('Messageをすべて削除できる', () => {
      store.dispatch(addMessage({
        type: MessageTypeInfo,
        message: 'add message'
      }));
      store.dispatch(addMessage({
        type: MessageTypeInfo,
        message: 'add message'
      }));
      expect(store.getState().length).toBe(2);

      store.dispatch(closeAllMessages());

      expect(store.getState().length).toBe(0);
    });
  });
});
