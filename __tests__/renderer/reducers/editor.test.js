// @flow

import { createStore } from 'redux';

import {
  initialEditorState,
  editor,
} from '../../../app/renderer/reducers/editor';
import {
  openBuffer,
  bufferUpdated,
} from '../../../app/renderer/actions/editor';
import {
  ItemTypeUndefined,
  createMetaDataID,
} from '../../../app/common/metadata';

let buffer;
let store;
beforeEach(() => {
  buffer = {
    id: createMetaDataID(),
    name: 'test',
    path: '',
    repositoryName: '',
    repositoryPath: '',
    absolutePath: '',
    itemType: ItemTypeUndefined,
    parentID: null,
    childrenIDs: [],
    isOpened: false,
    isLoaded: false,
    body: ''
  };

  store = createStore(editor, initialEditorState());
});

describe('editor reducer', () => {
  describe('OPEN_BUFFER', () => {
    it('バッファを開くことができる', () => {
      store.dispatch(openBuffer(buffer, 'hogehoge'));

      const newState = store.getState();

      expect(newState.buffer).toMatchObject(buffer);
      expect(newState.content).toBe('hogehoge');
    });
  });

  describe('BUFFER_UPDATED', () => {
    it('バッファを更新することができる', () => {
      store.dispatch(openBuffer(buffer, ''));

      let newState = store.getState();
      expect(newState.buffer).toMatchObject(buffer);
      expect(newState.content).toBe('');

      const newBuffer = Object.assign({}, buffer, {
        id: createMetaDataID()
      });

      store.dispatch(bufferUpdated(newBuffer, 'hogehoge'));

      newState = store.getState();
      expect(newState.buffer).toMatchObject(newBuffer);
      expect(newState.content).toBe('hogehoge');
    });
  });
});
