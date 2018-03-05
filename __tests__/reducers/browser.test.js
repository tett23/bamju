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
  updateCurrentTab,
  activeTab,
} from '../../app/actions/browser';
import {
  bufferContentUpdated,
} from '../../app/actions/buffers';

let store;
beforeEach(() => {
  store = createStore(browser, initialBrowserState());
});

describe('browser reducer', () => {
  describe('initialialBrowserState', () => {
    const state = initialBrowserState();

    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0]).toMatchObject({
      metaDataID: null,
    });
  });

  describe('ADD_TAB', () => {
    it('Tabの追加ができる', () => {
      expect(store.getState().tabs.length).toBe(1);
      const tab = store.dispatch(addTab('foo', ''));

      const newState = store.getState();

      expect(newState.tabs.length).toBe(2);
      expect(newState.tabs[1]).toMatchObject({
        id: tab.payload.id
      });
    });
  });

  describe('CLOSE_TAB', () => {
    it('Tabの削除ができる', () => {
      expect(store.getState().tabs.length).toBe(1);

      const tab = store.dispatch(addTab('foo', ''));

      expect(store.getState().tabs.length).toBe(2);

      store.dispatch(closeTab(tab.payload.id));

      expect(store.getState().tabs.length).toBe(1);
    });

    it('idが存在しない場合は何も起きない', () => {
      store.dispatch(addTab('foo', ''));

      expect(store.getState().tabs.length).toBe(2);

      store.dispatch(closeTab('hogehoge'));

      expect(store.getState().tabs.length).toBe(2);
    });

    it('tabs.length === 0にはならない', () => {
      expect(store.getState().tabs.length).toBe(1);

      store.dispatch(closeTab(store.getState().tabs[0].id));

      expect(store.getState().tabs.length).toBe(1);
      expect(store.getState().tabs[0]).toMatchObject({
        metaDataID: null,
      });
    });
  });

  describe('UPDATE_TAB', () => {
    it('metaDataの変更ができる', () => {
      const tab = store.dispatch(addTab('foo', 'bar'));
      store.dispatch(updateTab(tab.payload.id, 'hoge', 'fuga'));

      const newState = store.getState();

      expect(newState.tabs.length).toBe(2);
      expect(newState.tabs[1].metaDataID).toBe('hoge');
    });

    it('contentの変更ができる', () => {
      const tab = store.dispatch(addTab('foo', 'bar'));
      store.dispatch(updateTab(tab.payload.id, 'hoge', 'fuga'));

      const newState = store.getState();

      expect(newState.tabs.length).toBe(2);
      expect(newState.tabs[1].content).toBe('fuga');
    });

    it('idが存在しない場合何も起きない', () => {
      store.dispatch(addTab('foo', 'bar'));

      expect(store.getState().tabs.length).toBe(2);

      store.dispatch(updateTab('a', 'b', 'c'));

      const newState = store.getState();

      expect(newState.tabs.length).toBe(2);
      expect(newState.tabs[1].metaDataID).toBe('foo');
      expect(newState.tabs[1].content).toBe('bar');
    });
  });

  describe('UPDATE_CURRENT_TAB', () => {
    it('metaDataの変更ができる', () => {
      store.dispatch(addTab('foo', 'bar'));
      store.dispatch(updateCurrentTab('hoge', 'fuga'));

      const newState = store.getState();

      expect(newState.tabs.length).toBe(2);
      expect(newState.tabs[1].metaDataID).toBe('hoge');
    });
  });

  describe('BUFFER_CONTEND_UPDATED', () => {
    it('contentの変更ができる', () => {
      store.dispatch(addTab('foo', 'bar'));

      expect(store.getState().tabs[1].content).toBe('bar');

      store.dispatch(bufferContentUpdated('foo', 'hoge'));

      const newState = store.getState();

      expect(newState.tabs[1].content).toBe('hoge');
    });

    it('metaDataIDが一致しないタブは更新されない', () => {
      store.dispatch(addTab('foo', 'bar'));

      expect(store.getState().tabs[1].content).toBe('bar');

      store.dispatch(bufferContentUpdated('hogehoge', ''));

      const newState = store.getState();

      expect(newState.tabs[1].content).toBe('bar');
    });
  });

  describe('ACTIVE_TAB', () => {
    it('currentTabIDを変更する', () => {
      const tab = addTab('foo', 'bar');
      store.dispatch(tab);

      expect(store.getState().tabs.length).toBe(2);
      const tabID = store.getState().tabs[0].id;
      expect(store.getState().currentTabID).not.toBe(tabID);

      store.dispatch(activeTab(tabID));

      expect(store.getState().currentTabID).toBe(tabID);
    });

    it('idが存在しない場合は何もしない', () => {
      store.dispatch(addTab('foo', 'bar'));

      const state = store.getState();

      store.dispatch(activeTab('bar'));

      expect(store.getState()).toBe(state);
    });
  });
});
