// @flow

import { createStore } from 'redux';

import {
  initialRepositoriesTreeViewState,
  repositoriesTreeView,
} from '../../app/reducers/repositories_tree_view';
import {
  initializeRepositoriesTreeView,
  openBuffer,
  closeBuffer,
} from '../../app/actions/repositories_tree_view';

let store;
beforeEach(() => {
  store = createStore(repositoriesTreeView, initialRepositoriesTreeViewState());
});

describe('repositoriesTreeView reducer', () => {
  describe('INITIALIZE_REPOSITORIES_TREE_VIEW', () => {
    it('初期化できる', () => {
      expect(store.getState()).toMatchObject({});

      const init = {
        foo: { isOpened: true },
        bar: { isOpened: false }
      };
      store.dispatch(initializeRepositoriesTreeView(init));

      const newState = store.getState();

      // $FlowFixMe
      expect(newState.foo).toMatchObject({
        isOpened: true
      });
      // $FlowFixMe
      expect(newState.bar).toMatchObject({
        isOpened: false
      });
    });
  });

  describe('OPEN_BUFFER', () => {
    it('isOpenedがtrueになる', () => {
      // $FlowFixMe
      expect(store.getState().foo).not.toBe(expect.anything());

      store.dispatch(openBuffer('foo'));

      // $FlowFixMe
      expect(store.getState().foo.isOpened).toBe(true);
    });
  });

  describe('CLOSE_BUFFER', () => {
    it('オジェクトが破棄される', () => {
      store.dispatch(openBuffer('foo'));
      // $FlowFixMe
      expect(store.getState().foo.isOpened).toBe(true);

      store.dispatch(closeBuffer('foo'));

      // $FlowFixMe
      expect(store.getState().foo).not.toBe(expect.anything());
    });
  });
});
