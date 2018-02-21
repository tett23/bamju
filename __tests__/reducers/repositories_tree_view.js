// @flow

import { createStore } from 'redux';

import {
  initializeRepositoriesTreeView,
  openBuffer,
  closeBuffer,
} from '../../app/actions/repositories_tree_view';
import {
  reloadBuffers,
} from '../../app/actions/buffers';
import {
  appReducer,
  initialState,
} from '../../app/reducers/app_window';
import {
  dummy,
} from '../test_utils';

let store;
beforeEach(() => {
  store = createStore(appReducer, initialState());

  const dummyBuffers = dummy({
    test: ['/a/b/c.md']
  });

  store.dispatch(reloadBuffers(dummyBuffers));
});

describe('repositoriesTreeView reducer', () => {
  describe('INITIALIZE_REPOSITORIES_TREE_VIEW', () => {
    it('初期化できる', () => {
      expect(store.getState().repositoriesTreeView).toMatchObject({});

      const init = {
        foo: { isOpened: true },
        bar: { isOpened: false }
      };
      store.dispatch(initializeRepositoriesTreeView(init));

      const newState = store.getState();

      // $FlowFixMe
      expect(newState.repositoriesTreeView.foo).toMatchObject({
        isOpened: true
      });
      // $FlowFixMe
      expect(newState.repositoriesTreeView.bar).toMatchObject({
        isOpened: false
      });
    });
  });

  describe('OPEN_BUFFER', () => {
    it('isOpenedがtrueになる', () => {
      // $FlowFixMe
      expect(store.getState().repositoriesTreeView.foo).not.toBe(expect.anything());

      store.dispatch(openBuffer('foo'));

      // $FlowFixMe
      expect(store.getState().repositoriesTreeView.foo.isOpened).toBe(true);
    });

    it('子がopenされると親もopenされる', () => {
      // $FlowFixMe
      let id = store.getState().global.buffers.find((item) => {
        return item.path === '/a/b/c.md';
      }).id;
      store.dispatch(openBuffer(id));

      expect(store.getState().repositoriesTreeView[id].isOpened).toBe(true);

      // $FlowFixMe
      id = store.getState().global.buffers.find((item) => {
        return item.path === '/a/b';
      }).id;
      expect(store.getState().repositoriesTreeView[id].isOpened).toBe(true);

      // $FlowFixMe
      id = store.getState().global.buffers.find((item) => {
        return item.path === '/a';
      }).id;
      expect(store.getState().repositoriesTreeView[id].isOpened).toBe(true);

      // $FlowFixMe
      id = store.getState().global.buffers.find((item) => {
        return item.path === '/';
      }).id;
      expect(store.getState().repositoriesTreeView[id].isOpened).toBe(true);
    });
  });

  describe('CLOSE_BUFFER', () => {
    it('オジェクトが破棄される', () => {
      store.dispatch(openBuffer('foo'));
      // $FlowFixMe
      expect(store.getState().repositoriesTreeView.foo.isOpened).toBe(true);

      store.dispatch(closeBuffer('foo'));

      // $FlowFixMe
      expect(store.getState().repositoriesTreeView.foo).not.toBe(expect.anything());
    });
  });
});
