// @flow

import { createStore } from 'redux';

import {
  initialBrowserState,
  browser,
} from '../../app/reducers/browser';
import {
  addTab,
  closeTab,
  updateTab,
} from '../../app/actions/browser';

let store;
beforeEach(() => {
  store = createStore(browser, initialBrowserState());
});

describe('windows reducer', () => {
  describe('ADD_TAB', () => {
    it('Tabの追加ができる', () => {
      expect(store.getState().tabs.length).toBe(0);
      const tab = store.dispatch(addTab('foo', ''));

      const newState = store.getState();

      expect(newState.tabs.length).toBe(1);
      expect(newState.tabs[0]).toMatchObject({
        id: tab.payload.id
      });
    });
  });

  describe('CLOSE_TAB', () => {
    it('Tabの削除ができる', () => {
      expect(store.getState().tabs.length).toBe(0);

      const tab = store.dispatch(addTab('foo', ''));

      expect(store.getState().tabs.length).toBe(1);

      store.dispatch(closeTab(tab.payload.id));

      expect(store.getState().tabs.length).toBe(0);
    });

    it('idが存在しない場合は何も起きない', () => {
      store.dispatch(addTab('foo', ''));

      expect(store.getState().tabs.length).toBe(1);

      store.dispatch(closeTab('hogehoge'));

      expect(store.getState().tabs.length).toBe(1);
    });
  });

  describe('UPDATE_TAB', () => {
    it('metaDataの変更ができる', () => {
      const tab = store.dispatch(addTab('foo', 'bar'));
      store.dispatch(updateTab(tab.payload.id, 'hoge', 'fuga'));

      const newState = store.getState();

      expect(newState.tabs.length).toBe(1);
      expect(newState.tabs[0].metaDataID).toBe('hoge');
    });

    it('contentの変更ができる', () => {
      const tab = store.dispatch(addTab('foo', 'bar'));
      store.dispatch(updateTab(tab.payload.id, 'hoge', 'fuga'));

      const newState = store.getState();

      expect(newState.tabs.length).toBe(1);
      expect(newState.tabs[0].content).toBe('fuga');
    });

    it('idが存在しない場合何も起きない', () => {
      store.dispatch(addTab('foo', 'bar'));

      expect(store.getState().tabs.length).toBe(1);

      store.dispatch(updateTab('a', 'b', 'c'));

      const newState = store.getState();

      expect(newState.tabs.length).toBe(1);
      expect(newState.tabs[0].metaDataID).toBe('foo');
      expect(newState.tabs[0].content).toBe('bar');
    });
  });
});
