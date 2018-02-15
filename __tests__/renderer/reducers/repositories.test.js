// @flow

import { createStore } from 'redux';

import {
  initialRepositoriesState,
  repositories,
} from '../../../app/renderer/reducers/repositories';
import {
  reloadRepositories,
  updateBuffers,
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
    const buffers = Object.keys(dummyBuffers).reduce((r, k) => {
      return r.concat(dummyBuffers[k]);
    }, []);
    store.dispatch(reloadRepositories(buffers));
  });

  describe('RELOAD_REPOSITORIES', () => {
    it('repositoriesの更新ができる', () => {
      const dummyBuffers = dummy({
        test: ['/foo.md']
      });
      const buffers = Object.keys(dummyBuffers).reduce((r, k) => {
        return r.concat(dummyBuffers[k]);
      }, []);
      store.dispatch(reloadRepositories(buffers));
      const newState = store.getState();

      expect(newState.buffers).not.toBe(undefined);
      expect(newState.buffers.length).toBe(2);
      expect(newState.buffers[0]).toMatchObject({
        path: '/'
      });
      expect(newState.buffers[1]).toMatchObject({
        path: '/foo.md'
      });
    });

    it('repositoriesが空のときは空になる', () => {
      store.dispatch(reloadRepositories([]));
      const newState = store.getState();

      expect(newState.buffers.length).toBe(0);
    });
  });

  describe('UPDATE_BUFFERS', () => {
    describe('change', () => {
      it('バッファを更新することができる', () => {
        const buf = deepCopy(store.getState().buffers[1]);
        buf.path = '/bar.md';
        store.dispatch(updateBuffers({
          changes: [buf]
        }));

        const newState = store.getState();

        expect(newState.buffers.length).toBe(2);
        expect(newState.buffers[1]).toMatchObject(buf);
      });

      it('存在しないbufferを更新しようとしても何もしない', () => {
        const buffers = deepCopy(store.getState().buffers);
        store.dispatch(updateBuffers({
          changes: [
            createDummyBufferByPath('test', '/bar.md')
          ]
        }));

        const newState = store.getState();

        expect(newState.buffers.length).toBe(2);
        expect(newState.buffers).toMatchObject(buffers);
      });

      it('buffersが空のときは何もしない', () => {
        const buffers = deepCopy(store.getState().buffers);
        store.dispatch(updateBuffers({
          changes: []
        }));
        const newState = store.getState();

        expect(newState.buffers.length).toBe(2);
        expect(newState.buffers).toMatchObject(buffers);
      });
    });

    describe('add', () => {
      it('Bufferの追加ができる', () => {
        store.dispatch(updateBuffers({
          additions: [
            createDummyBufferByPath('test', '/bar.md'),
            createDummyBufferByPath('test', '/baz.md')
          ]
        }));
        const newState = store.getState();

        expect(newState.buffers.length).toBe(4);
      });

      it('repositoryが存在しない場合は追加する', () => {
        const buf = createDummyBufferByPath('foo', '/bar.md');
        store.dispatch(updateBuffers({
          additions: [buf]
        }));
        const newState = store.getState();

        expect(newState.buffers.length).toBe(3);
        expect(newState.buffers[2]).toBe(buf);
      });

      it('buffersが空のときは何もしない', () => {
        const buffers = deepCopy(store.getState().buffers);
        store.dispatch(updateBuffers({
          additions: []
        }));
        const newState = store.getState();

        expect(newState.buffers.length).toBe(2);
        expect(newState.buffers).toMatchObject(buffers);
      });

      it('すでに存在するBufferのときは何もしない', () => {
        const buf = createDummyBufferByPath('test', '/baz.md');
        store.dispatch(updateBuffers({
          additions: [buf]
        }));
        const newState = store.getState();

        expect(newState.buffers.length).toBe(3);

        const buffers = deepCopy(store.getState().buffers);

        store.dispatch(updateBuffers({
          additions: [buf]
        }));

        expect(newState.buffers.length).toBe(3);
        expect(newState.buffers).toMatchObject(buffers);
      });
    });

    describe('remove', () => {
      it('Bufferの削除ができる', () => {
        const buf = deepCopy(store.getState().buffers[1]);
        store.dispatch(updateBuffers({
          removes: [buf.id]
        }));
        const newState = store.getState();

        expect(newState.buffers.length).toBe(1);
      });

      it('Bufferが存在しない場合何もしない', () => {
        const buf = deepCopy(store.getState().buffers[1]);
        buf.id = createMetaDataID();
        store.dispatch(updateBuffers({
          removes: [buf.id]
        }));
        const newState = store.getState();

        expect(newState.buffers.length).toBe(2);
      });
    });

    describe('add change', () => {
      it('追加と更新ができる', () => {
        const parent = deepCopy(store.getState().buffers[0]);
        expect(parent).toMatchObject({
          path: '/',
        });
        const newFile = createDummyBufferByPath('test', '/bar.md');
        parent.childrenIDs.push(newFile.id);

        expect(store.getState().buffers.length).toBe(2);
        expect(store.getState().buffers[0].childrenIDs.length).toBe(1);

        store.dispatch(updateBuffers({
          additions: [newFile],
          changes: [parent]
        }));
        const newState = store.getState();

        expect(newState.buffers.length).toBe(3);
        expect(newState.buffers[0]).toMatchObject({
          path: '/',
        });
        expect(newState.buffers[0].childrenIDs.length).toBe(2);
      });
    });
  });
});
