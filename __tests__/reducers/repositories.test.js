// @flow

import { createStore } from 'redux';

import {
  initialRepositoriesState,
  repositories,
} from '../../app/reducers/repositories';
import {
  initializeRepositories,
  addRepository,
  removeRepository,
} from '../../app/actions/repositories';

let store;
beforeEach(() => {
  store = createStore(repositories, initialRepositoriesState());
});

describe('repositories reducer', () => {
  describe('INITIALIZE_REPOSITORIES', () => {
    it('repositoriesの初期化ができる', () => {
      expect(store.getState().length).toBe(0);

      const init = [{
        absolutePath: '/tmp/bamju/test',
        repositoryName: 'test'
      }];
      store.dispatch(initializeRepositories(init));

      expect(store.getState()).toMatchObject(init);
    });

    it('stateが空なら初期化後も空', () => {
      expect(store.getState().length).toBe(0);

      store.dispatch(initializeRepositories([]));

      expect(store.getState().length).toBe(0);
    });
  });

  describe('ADD_REPOSITORY', () => {
    it('Repositoryを追加できる', () => {
      const absolutePath = '/tmp/bamju/test';
      store.dispatch(addRepository(absolutePath));

      const newState = store.getState();

      expect(newState.length).toBe(1);
      expect(newState[0]).toMatchObject({
        absolutePath,
        repositoryName: 'test'
      });
    });

    it('absolutePathがすでに存在している場合は何もしない', () => {
      const absolutePath = '/tmp/bamju/test';
      store.dispatch(addRepository(absolutePath));
      const state = store.getState();
      store.dispatch(addRepository(absolutePath));

      expect(state).toBe(store.getState());
    });
  });

  describe('REMOVE_REPOSITORY', () => {
    const absolutePath = '/tmp/bamju/test';
    beforeEach(() => {
      store.dispatch(addRepository(absolutePath));
    });

    it('Repositoryの削除ができる', () => {
      expect(store.getState().length).toBe(1);
      store.dispatch(removeRepository(absolutePath, 'test'));
      expect(store.getState().length).toBe(0);
    });

    it('該当するRepositoryの削除ができる', () => {
      expect(store.getState().length).toBe(1);
      store.dispatch(removeRepository('foo', 'bar'));
      expect(store.getState().length).toBe(1);
      store.dispatch(removeRepository(absolutePath, 'test'));
      expect(store.getState().length).toBe(0);
    });

    it('該当するRepositoryが存在しない場合は何もしない', () => {
      expect(store.getState().length).toBe(1);
      store.dispatch(removeRepository('foo', 'bar'));
      expect(store.getState().length).toBe(1);
    });
  });
});
