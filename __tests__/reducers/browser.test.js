// @flow

import {
  createStore,
  applyMiddleware,
  combineReducers,
} from 'redux';
import thunk from 'redux-thunk';

import {
  initialBrowserState,
  browser,
} from '../../app/reducers/browser';
import {
  addTab,
  closeTab,
  closeAllTabs,
  updateTab,
  updateCurrentTab,
  activeTab,
  addOrActiveTab,
} from '../../app/actions/browser';
import {
  bufferContentUpdated,
} from '../../app/actions/buffers';
import {
  appReducer,
  initialState,
} from '../../app/reducers/app_window';

let store;
beforeEach(() => {
  store = createStore(appReducer, initialState(), applyMiddleware(thunk));
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
      expect(store.getState().browser.tabs.length).toBe(1);
      const tab = store.dispatch(addTab('foo', ''));

      const newState = store.getState();

      expect(newState.browser.tabs.length).toBe(2);
      expect(newState.browser.tabs[1]).toMatchObject({
        id: tab.payload.id
      });
    });
  });

  describe('CLOSE_TAB', () => {
    it('Tabの削除ができる', () => {
      expect(store.getState().browser.tabs.length).toBe(1);

      const tab = store.dispatch(addTab('foo', ''));

      expect(store.getState().browser.tabs.length).toBe(2);

      store.dispatch(closeTab(tab.payload.id));

      expect(store.getState().browser.tabs.length).toBe(1);
    });

    it('idが存在しない場合は何も起きない', () => {
      store.dispatch(addTab('foo', ''));

      expect(store.getState().browser.tabs.length).toBe(2);

      store.dispatch(closeTab('hogehoge'));

      expect(store.getState().browser.tabs.length).toBe(2);
    });

    it('tabs.length === 0にはならない', () => {
      expect(store.getState().browser.tabs.length).toBe(1);

      store.dispatch(closeTab(store.getState().browser.tabs[0].id));

      expect(store.getState().browser.tabs.length).toBe(1);
      expect(store.getState().browser.tabs[0]).toMatchObject({
        metaDataID: null,
      });
    });

    describe('CLOSE_ALL_TABS', () => {
      it('全てのタブが閉じられ、空のタブだけになる', () => {
        const state = store.getState().browser;
        store.dispatch(closeAllTabs());
        expect(store.getState().browser).not.toBe(state);
        expect(store.getState().browser.tabs.length).toBe(1);
      });
    });

    it('activeのタブが閉じられると隣のtabがactiveになる', () => {
      expect(store.getState().browser.tabs.length).toBe(1);

      const nextTabID = store.getState().browser.tabs[0].id;
      const tab = addTab('foo', 'bar');
      store.dispatch(tab);
      expect(store.getState().browser.tabs.length).toBe(2);
      expect(store.getState().browser.currentTabID).toBe(tab.payload.id);

      store.dispatch(closeTab(tab.payload.id));

      expect(store.getState().browser.currentTabID).toBe(nextTabID);
    });

    it('activeでないタブが閉じられたときはactiveを変更しない', () => {
      expect(store.getState().browser.tabs.length).toBe(1);

      const tab = addTab('foo', 'bar');
      store.dispatch(tab);
      expect(store.getState().browser.tabs.length).toBe(2);
      expect(store.getState().browser.currentTabID).toBe(tab.payload.id);

      store.dispatch(closeTab(store.getState().browser.tabs[0].id));

      expect(store.getState().browser.currentTabID).toBe(tab.payload.id);
    });

    it('0番目のタブが閉じられたときは1番目のタブがactiveになる', () => {
      expect(store.getState().browser.tabs.length).toBe(1);

      const tab = addTab('foo', 'bar');
      store.dispatch(tab);
      expect(store.getState().browser.tabs.length).toBe(2);
      store.dispatch(activeTab(store.getState().browser.tabs[0].id));
      store.dispatch(closeTab(store.getState().browser.tabs[0].id));

      expect(store.getState().browser.currentTabID).toBe(tab.payload.id);
    });

    it('全てのタブが閉じられたら新しい0番目のタブがactiveになる', () => {
      expect(store.getState().browser.tabs.length).toBe(1);
      const tab = store.getState().browser.tabs[0];
      store.dispatch(closeTab(tab.id));

      expect(store.getState().browser.currentTabID).not.toBe(tab.id);
      expect(store.getState().browser.currentTabID).toBe(store.getState().browser.tabs[0].id);
    });
  });

  describe('UPDATE_TAB', () => {
    it('metaDataの変更ができる', () => {
      const tab = store.dispatch(addTab('foo', 'bar'));
      store.dispatch(updateTab(tab.payload.id, 'hoge', 'fuga'));

      const newState = store.getState();

      expect(newState.browser.tabs.length).toBe(2);
      expect(newState.browser.tabs[1].metaDataID).toBe('hoge');
    });

    it('contentの変更ができる', () => {
      const tab = store.dispatch(addTab('foo', 'bar'));
      store.dispatch(updateTab(tab.payload.id, 'hoge', 'fuga'));

      const newState = store.getState();

      expect(newState.browser.tabs.length).toBe(2);
      expect(newState.browser.tabs[1].content).toBe('fuga');
    });

    it('idが存在しない場合何も起きない', () => {
      store.dispatch(addTab('foo', 'bar'));

      expect(store.getState().browser.tabs.length).toBe(2);

      store.dispatch(updateTab('a', 'b', 'c'));

      const newState = store.getState();

      expect(newState.browser.tabs.length).toBe(2);
      expect(newState.browser.tabs[1].metaDataID).toBe('foo');
      expect(newState.browser.tabs[1].content).toBe('bar');
    });
  });

  describe('UPDATE_CURRENT_TAB', () => {
    it('metaDataの変更ができる', () => {
      store.dispatch(addTab('foo', 'bar'));
      store.dispatch(updateCurrentTab('hoge', 'fuga'));

      const newState = store.getState();

      expect(newState.browser.tabs.length).toBe(2);
      expect(newState.browser.tabs[1].metaDataID).toBe('hoge');
    });
  });

  describe('BUFFER_CONTEND_UPDATED', () => {
    it('contentの変更ができる', () => {
      store.dispatch(addTab('foo', 'bar'));

      expect(store.getState().browser.tabs[1].content).toBe('bar');

      store.dispatch(bufferContentUpdated('foo', 'hoge'));

      const newState = store.getState();

      expect(newState.browser.tabs[1].content).toBe('hoge');
    });

    it('metaDataIDが一致しないタブは更新されない', () => {
      store.dispatch(addTab('foo', 'bar'));

      expect(store.getState().browser.tabs[1].content).toBe('bar');

      store.dispatch(bufferContentUpdated('hogehoge', ''));

      const newState = store.getState();

      expect(newState.browser.tabs[1].content).toBe('bar');
    });
  });

  describe('ACTIVE_TAB', () => {
    it('currentTabIDを変更する', () => {
      const tab = addTab('foo', 'bar');
      store.dispatch(tab);

      expect(store.getState().browser.tabs.length).toBe(2);
      const tabID = store.getState().browser.tabs[0].id;
      expect(store.getState().browser.currentTabID).not.toBe(tabID);

      store.dispatch(activeTab(tabID));

      expect(store.getState().browser.currentTabID).toBe(tabID);
    });

    it('idが存在しない場合は何もしない', () => {
      store.dispatch(addTab('foo', 'bar'));

      const state = store.getState().browser;

      store.dispatch(activeTab('bar'));

      expect(store.getState().browser).toBe(state);
    });
  });

  describe('addOrActiveTab', () => {
    beforeEach(() => {
      store.dispatch(closeAllTabs());
      expect(store.getState().browser.tabs.length).toBe(1);
    });

    it('metaDataIDのTabが存在しない場合、Tabが追加される', () => {
      const tab = store.dispatch(addOrActiveTab('foo'));

      expect(store.getState().browser.tabs.length).toBe(2);
      expect(store.getState().browser.tabs[1]).toMatchObject(tab.payload);
    });

    it('Tabが追加された場合、currentTabIDも変更される', () => {
      const tab = store.dispatch(addOrActiveTab('foo'));

      expect(store.getState().browser.tabs.length).toBe(2);
      expect(store.getState().browser.currentTabID).toBe(tab.payload.id);
    });

    it('metaDataIDのTabが存在する場合、currentTabIDが存在するTabのidになる', () => {
      const tab = store.dispatch(addTab('foo', ''));
      store.dispatch(addOrActiveTab('foo'));

      expect(store.getState().browser.tabs.length).toBe(2);
      expect(store.getState().browser.currentTabID).toBe(tab.payload.id);
    });
  });
});
