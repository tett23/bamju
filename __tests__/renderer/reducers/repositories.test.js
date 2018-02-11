// @flow

import { createStore } from 'redux';

import {
  initialRepositoriesState,
  repositories,
} from '../../../app/renderer/reducers/repositories';
import {
  reloadRepositories,
  updateBuffers,
  addBuffers,
  removeBuffers
} from '../../../app/renderer/actions/repositories';
import {
  createMetaDataID,
} from '../../../app/common/metadata';
import {
  deepCopy
} from '../../../app/common/util';

import '../../global_config.test';
import {
  dummy,
  createDummyBufferByPath,
} from '../../test_utils';

let store;
beforeEach(() => {
  store = createStore(repositories, initialRepositoriesState());
});

describe('repositories reducer', () => {
  beforeEach(() => {
    const dummyBuffers = dummy({
      test: ['/foo.md']
    });
    store.dispatch(reloadRepositories(dummyBuffers));
  });

  describe('RELOAD_REPOSITORIES', () => {
    it('repositoriesの更新ができる', () => {
      const dummyBuffers = dummy({
        test: ['/foo.md']
      });
      store.dispatch(reloadRepositories(dummyBuffers));

      const newState = store.getState();

      expect(Object.keys(newState)).not.toBe(1);
      expect(newState.test).not.toBe(undefined);
      expect(newState.test.length).toBe(2);
      expect(newState.test[0]).toMatchObject({
        path: '/'
      });
      expect(newState.test[1]).toMatchObject({
        path: '/foo.md'
      });
    });

    it('repositoriesが空のときは空になる', () => {
      store.dispatch(reloadRepositories({}));
      const newState = store.getState();

      expect(Object.keys(newState).length).toBe(0);
    });
  });

  describe('UPDATE_BUFFERS', () => {
    it('バッファを更新することができる', () => {
      const buf = deepCopy(store.getState().test[1]);
      buf.path = '/bar.md';
      store.dispatch(updateBuffers([buf]));

      const newState = store.getState();

      expect(newState.test.length).toBe(2);
      expect(newState.test[1]).toMatchObject(buf);
    });

    it('存在しないbufferを更新しようとしても何もしない', () => {
      const buffers = deepCopy(store.getState().test);
      store.dispatch(updateBuffers([
        createDummyBufferByPath('test', '/bar.md'),
      ]));

      const newState = store.getState();

      expect(Object.keys(newState).length).toBe(1);
      expect(newState.test.length).toBe(2);
      expect(newState.test).toMatchObject(buffers);
    });

    it('buffersが空のときは何もしない', () => {
      const buffers = deepCopy(store.getState().test);
      store.dispatch(updateBuffers([]));
      const newState = store.getState();

      expect(Object.keys(newState).length).toBe(1);
      expect(newState.test.length).toBe(2);
      expect(newState.test).toMatchObject(buffers);
    });
  });

  describe('ADD_BUFFERS', () => {
    it('Bufferの追加ができる', () => {
      store.dispatch(addBuffers([
        createDummyBufferByPath('test', '/bar.md'),
        createDummyBufferByPath('test', '/baz.md')
      ]));

      const newState = store.getState();

      expect(newState.test.length).toBe(4);
    });

    it('repositoryが存在しない場合は追加する', () => {
      const buf = createDummyBufferByPath('foo', '/bar.md');
      store.dispatch(addBuffers([buf]));
      const newState = store.getState();

      expect(Object.keys(newState).length).toBe(2);
      expect(newState.foo.length).toBe(1);
      expect(newState.foo[0]).toBe(buf);
    });

    it('buffersが空のときは何もしない', () => {
      const buffers = deepCopy(store.getState().test);
      store.dispatch(addBuffers([]));
      const newState = store.getState();

      expect(Object.keys(newState).length).toBe(1);
      expect(newState.test.length).toBe(2);
      expect(newState.test).toMatchObject(buffers);
    });

    it('すでに存在するBufferのときは何もしない', () => {
      const buf = createDummyBufferByPath('test', '/baz.md');
      store.dispatch(addBuffers([buf]));
      const newState = store.getState();

      expect(newState.test.length).toBe(3);

      const buffers = deepCopy(store.getState().test);

      store.dispatch(addBuffers([buf]));

      expect(Object.keys(newState).length).toBe(1);
      expect(newState.test.length).toBe(3);
      expect(newState.test).toMatchObject(buffers);
    });
  });

  describe('REMOVE_BUFFERS', () => {
    it('Bufferの削除ができる', () => {
      const buf = deepCopy(store.getState().test[1]);
      store.dispatch(removeBuffers([buf]));
      const newState = store.getState();

      expect(Object.keys(newState).length).toBe(1);
      expect(newState.test.length).toBe(1);
    });

    it('Bufferが存在しない場合何もしない', () => {
      const buf = deepCopy(store.getState().test[1]);
      buf.id = createMetaDataID();
      store.dispatch(removeBuffers([buf]));
      const newState = store.getState();

      expect(Object.keys(newState).length).toBe(1);
      expect(newState.test.length).toBe(2);
    });
  });
});
