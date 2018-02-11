// @flow

import { createStore } from 'redux';

import {
  initialBrowserState,
  browser,
} from '../../../app/renderer/reducers/browser';
import {
  openBuffer,
  bufferContentUpdated,
} from '../../../app/renderer/actions/tab';
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

  store = createStore(browser, initialBrowserState());
});

describe('browser reducer', () => {
  // TODO: Buffer渡さないでidだけ渡すようにする
  describe('OPEN_PAGE', () => {
    it('バッファを開くことができる', () => {
      store.dispatch(openBuffer(buffer, 'hogehoge'));

      const newState = store.getState();

      expect(newState.tabs[0].content).toBe('hogehoge');
    });
  });

  describe('BUFFER_UPDATED', () => {
    it('バッファを更新することができる', () => {
      store.dispatch(openBuffer(buffer, ''));
      store.dispatch(bufferContentUpdated(buffer.id, 'hogehoge'));

      const newState = store.getState();

      expect(newState.tabs[0].content).toBe('hogehoge');
    });

    it('バッファが存在しない場合は何も起きない', () => {
      store.dispatch(openBuffer(buffer, ''));
      store.dispatch(bufferContentUpdated(createMetaDataID(), 'hogehoge'));

      const newState = store.getState();

      expect(newState.tabs[0].content).toBe('');
    });
  });
});