// @flow

import { createStore } from 'redux';

import {
  initialSearchesState,
  searches,
} from '../../app/reducers/searches';
import {
  defaultOptions,
} from '../../app/common/search';
import {
  search,
  cancel,
  destroy,
  updateQuery,
  updateOptions,
  updateProgress,
  updateResult,
  incrementProgress,
  complete,
} from '../../app/actions/searches';

let store;
beforeEach(() => {
  store = createStore(searches, initialSearchesState());
});

describe('searches reducer', () => {
  describe('search', () => {
    it('SearchStateを追加できる', () => {
      expect(store.getState().length).toBe(0);
      store.dispatch(search('', null));
      expect(store.getState().length).toBe(1);
    });

    it('queryIDが同じものは追加できない', () => {
      expect(store.getState().length).toBe(0);
      const searchAction = search('', null);
      store.dispatch(searchAction);
      expect(store.getState().length).toBe(1);
      store.dispatch(searchAction);
      expect(store.getState().length).toBe(1);
    });

    it('作成された時点で、completedはfalse', () => {
      expect(store.getState().length).toBe(0);
      store.dispatch(search('', null));
      expect(store.getState()[0].completed).toBe(false);
    });
  });

  describe('cancel', () => {
    it('queryIDのもので更新ができる', () => {
      expect(store.getState().length).toBe(0);
      const searchAction = search('foo', null);
      store.dispatch(searchAction);
      expect(store.getState()[0].completed).toBe(false);
      const queryID = searchAction.payload.queryID;
      store.dispatch(cancel(queryID));
      expect(store.getState()[0].completed).toBe(true);
    });

    it('queryID存在しない場合、何もしない', () => {
      store.dispatch(search('', null));
      const state = store.getState();
      store.dispatch(cancel('foo'));
      expect(store.getState()).toBe(state);
    });
  });

  describe('destroy', () => {
    it('queryIDのもので更新ができる', () => {
      expect(store.getState().length).toBe(0);
      const searchAction = search('foo', null);
      store.dispatch(searchAction);
      expect(store.getState().length).toBe(1);
      const queryID = searchAction.payload.queryID;
      store.dispatch(destroy(queryID));
      expect(store.getState().length).toBe(0);
    });

    it('queryID存在しない場合、何もしない', () => {
      store.dispatch(search('', null));
      const state = store.getState();
      store.dispatch(destroy('foo'));
      expect(store.getState()).toBe(state);
    });
  });

  describe('updateQuery', () => {
    it('queryIDのもので更新ができる', () => {
      expect(store.getState().length).toBe(0);
      const searchAction = search('foo', null);
      store.dispatch(searchAction);
      expect(store.getState()[0].query).toBe('foo');
      const queryID = searchAction.payload.queryID;
      store.dispatch(updateQuery(queryID, 'bar'));
      expect(store.getState()[0].query).toBe('bar');
    });

    it('queryID存在しない場合、何もしない', () => {
      store.dispatch(search('', null));
      const state = store.getState();
      store.dispatch(updateQuery('foo', ''));
      expect(store.getState()).toBe(state);
    });
  });

  describe('updateOptions', () => {
    let options;
    beforeEach(() => {
      options = defaultOptions;
    });

    it('queryIDのもので更新ができる', () => {
      expect(store.getState().length).toBe(0);
      const searchAction = search('foo', null);
      store.dispatch(searchAction);
      expect(store.getState()[0].query).toBe('foo');
      const queryID = searchAction.payload.queryID;
      const newOptions = Object.assign({}, options, {
        queryType: 'fullText',
      });
      store.dispatch(updateOptions(queryID, newOptions));
      expect(store.getState()[0].options.queryType).toBe('fullText');
    });

    it('queryID存在しない場合、何もしない', () => {
      store.dispatch(search('', null));
      const state = store.getState();
      store.dispatch(updateOptions('foo', options));
      expect(store.getState()).toBe(state);
    });
  });

  describe('updateProgress', () => {
    it('queryIDのもので更新ができる', () => {
      expect(store.getState().length).toBe(0);
      const searchAction = search('', null);
      store.dispatch(searchAction);
      expect(store.getState()[0].progress).toMatchObject({
        current: 0,
        total: 0,
      });
      const queryID = searchAction.payload.queryID;
      const progress = {
        current: 1,
        total: 1,
      };
      store.dispatch(updateProgress(queryID, progress));
      expect(store.getState()[0].progress).toMatchObject(progress);
    });

    it('queryID存在しない場合、何もしない', () => {
      store.dispatch(search('', null));
      const state = store.getState();
      store.dispatch(updateProgress('foo', {
        current: 1,
        total: 1,
      }));
      expect(store.getState()).toBe(state);
    });
  });

  describe('incrementProgress', () => {
    it('queryIDのもので更新ができる', () => {
      expect(store.getState().length).toBe(0);
      const searchAction = search('', null);
      store.dispatch(searchAction);
      const queryID = searchAction.payload.queryID;
      const progress = {
        current: 0,
        total: 100,
      };
      store.dispatch(updateProgress(queryID, progress));
      store.dispatch(incrementProgress(queryID));
      expect(store.getState()[0].progress).toMatchObject({
        current: 1,
        total: 100,
      });
    });

    it('queryID存在しない場合、何もしない', () => {
      store.dispatch(search('', null));
      const state = store.getState();
      store.dispatch(incrementProgress('foo'));
      expect(store.getState()).toBe(state);
    });
  });

  describe('updateResult', () => {
    let result;
    beforeEach(() => {
      result = {
        buffer: {
          id: 'foo',
          name: 'foo',
          path: '/foo',
          repositoryName: 'bar',
          repositoryPath: '/tmp/test/bar',
          absolutePath: '/tmp/test/foo/bar',
          itemType: 'directory',
          parentID: null,
          childrenIDs: [],
          isLoaded: true,
          body: ''
        },
        position: {
          size: 0,
          offset: 0
        },
        detail: null
      };
    });

    it('queryIDのもので更新ができる', () => {
      expect(store.getState().length).toBe(0);
      const searchAction = search('', null);
      store.dispatch(searchAction);
      expect(store.getState()[0].results.length).toBe(0);
      const queryID = searchAction.payload.queryID;
      store.dispatch(updateResult(queryID, result));
      expect(store.getState()[0].results.length).toBe(1);
      expect(store.getState()[0].results[0]).toMatchObject(result);
    });

    it('queryID存在しない場合、何もしない', () => {
      store.dispatch(search('', null));
      const state = store.getState();
      store.dispatch(updateResult('foo', result));
      expect(store.getState()).toBe(state);
    });
  });

  describe('complete', () => {
    it('queryIDのもので更新ができる', () => {
      expect(store.getState().length).toBe(0);
      const searchAction = search('', null);
      store.dispatch(searchAction);
      expect(store.getState()[0].completed).toBe(false);
      const queryID = searchAction.payload.queryID;
      store.dispatch(complete(queryID));
      expect(store.getState()[0].completed).toBe(true);
    });

    it('queryID存在しない場合、何もしない', () => {
      store.dispatch(search('', null));
      const state = store.getState();
      store.dispatch(complete('foo'));
      expect(store.getState()).toBe(state);
    });
  });
});
