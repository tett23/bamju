// @flow

import { createStore } from 'redux';

import {
  initialWindowsState,
  windows,
} from '../../app/reducers/windows';
import {
  newWindow,
  closeWindow,
  updateWindowRectangle,
  addTab,
  closeTab,
  updateTab,
} from '../../app/actions/windows';

let store;
beforeEach(() => {
  store = createStore(windows, initialWindowsState());
});

describe('windows reducer', () => {
  describe('NEW_WINDOW', () => {
    it('Windowを追加できる', () => {
      expect(store.getState().length).toBe(0);

      store.dispatch(newWindow());

      const newState = store.getState();

      expect(newState.length).toBe(1);
      expect(newState[0]).toMatchObject({
        tabs: []
      });
    });

    it('rectangleを指定して追加できる', () => {
      expect(store.getState().length).toBe(0);

      const rectangle = {
        x: 10,
        y: 20,
        width: 30,
        height: 40
      };
      store.dispatch(newWindow(rectangle));

      const newState = store.getState();

      expect(newState.length).toBe(1);
      expect(newState[0]).toMatchObject({
        rectangle
      });
    });

    it('tabsを指定して追加できる', () => {
      expect(store.getState().length).toBe(0);

      const tabs = [{
        id: 'foo',
        metaDataID: 'bar',
        content: 'baz'
      }];
      store.dispatch(newWindow(undefined, tabs));

      const newState = store.getState();

      expect(newState.length).toBe(1);
      expect(newState[0]).toMatchObject({
        tabs
      });
    });
  });

  describe('CLOSE_WINDOW', () => {
    it('Windowの削除ができる', () => {
      expect(store.getState().length).toBe(0);
      const window = store.dispatch(newWindow());

      expect(store.getState().length).toBe(1);
      store.dispatch(closeWindow(window.windowID));

      expect(store.getState().length).toBe(0);
    });

    it('windowIDが存在しない場合は何も起きない', () => {
      store.dispatch(newWindow());
      expect(store.getState().length).toBe(1);

      store.dispatch(closeWindow('hogehoge'));

      expect(store.getState().length).toBe(1);
    });
  });

  describe('UPDATE_WINDOW_RECTANGLE', () => {
    it('Window.rectangleの更新ができる', () => {
      const window = store.dispatch(newWindow());
      expect(store.getState()[0].rectangle).toMatchObject({
        x: 100,
        y: 100,
        width: 1024,
        height: 728
      });

      const rectangle = {
        x: 10,
        y: 20,
        width: 30,
        height: 40
      };
      store.dispatch(updateWindowRectangle(window.windowID, rectangle));

      expect(store.getState()[0].rectangle).toMatchObject(rectangle);
    });

    it('windowIDが存在しない場合は何も起きない', () => {
      store.dispatch(newWindow());
      expect(store.getState()[0].rectangle).toMatchObject({
        x: 100,
        y: 100,
        width: 1024,
        height: 728
      });

      store.dispatch(updateWindowRectangle('foo', {
        x: 10,
        y: 20,
        width: 30,
        height: 40
      }));

      expect(store.getState()[0].rectangle).toMatchObject({
        x: 100,
        y: 100,
        width: 1024,
        height: 728
      });
    });
  });

  describe('ADD_TAB', () => {
    it('Tabの追加ができる', () => {
      const window = store.dispatch(newWindow());
      expect(store.getState()[0].tabs.length).toBe(0);
      const tab = store.dispatch(addTab(window.windowID, '', ''));

      const newState = store.getState();

      expect(newState.length).toBe(1);
      expect(newState[0].tabs.length).toBe(1);
      expect(newState[0].tabs[0]).toMatchObject({
        id: tab.tabID
      });
    });

    it('windowIDが存在しない場合は何も起きない', () => {
      store.dispatch(newWindow());
      expect(store.getState()[0].tabs.length).toBe(0);

      store.dispatch(addTab('foo', '', ''));

      expect(store.getState()[0].tabs.length).toBe(0);
    });
  });

  describe('CLOSE_TAB', () => {
    it('Tabの追加ができる', () => {
      const window = store.dispatch(newWindow());
      const tab = store.dispatch(addTab(window.windowID, '', ''));

      expect(store.getState().length).toBe(1);
      expect(store.getState()[0].tabs.length).toBe(1);

      store.dispatch(closeTab(window.windowID, tab.tabID));

      expect(store.getState()[0].tabs.length).toBe(0);
    });

    it('tabIDが存在しない場合は何も起きない', () => {
      const window = store.dispatch(newWindow());
      store.dispatch(addTab(window.windowID, '', ''));

      expect(store.getState().length).toBe(1);

      store.dispatch(closeTab(window.windowID, 'hogehoge'));

      expect(store.getState()[0].tabs.length).toBe(1);
    });
  });

  describe('UPDATE_TAB', () => {
    it('metaDataの変更ができる', () => {
      const window = store.dispatch(newWindow());
      const tab = store.dispatch(addTab(window.windowID, 'foo', 'bar'));
      store.dispatch(updateTab(window.windowID, tab.tabID, 'hoge', 'fuga'));

      const newState = store.getState();

      expect(newState[0].tabs.length).toBe(1);
      expect(newState[0].tabs[0].metaDataID).toBe('hoge');
    });

    it('contentの変更ができる', () => {
      const window = store.dispatch(newWindow());
      const tab = store.dispatch(addTab(window.windowID, 'foo', 'bar'));
      store.dispatch(updateTab(window.windowID, tab.tabID, 'hoge', 'fuga'));

      const newState = store.getState();

      expect(newState[0].tabs.length).toBe(1);
      expect(newState[0].tabs[0].content).toBe('fuga');
    });

    it('windowIDが存在しない場合何も起きない', () => {
      const window = store.dispatch(newWindow());
      const tab = store.dispatch(addTab(window.windowID, 'foo', 'bar'));

      expect(store.getState().length).toBe(1);
      expect(store.getState()[0].tabs.length).toBe(1);

      store.dispatch(updateTab('a', tab.id, 'hoge', 'fuga'));

      const newState = store.getState();

      expect(newState[0].tabs.length).toBe(1);
      expect(newState[0].tabs[0].metaDataID).toBe('foo');
      expect(newState[0].tabs[0].content).toBe('bar');
    });

    it('tabIDが存在しない場合何も起きない', () => {
      const window = store.dispatch(newWindow());
      store.dispatch(addTab(window.windowID, 'foo', 'bar'));

      expect(store.getState().length).toBe(1);
      expect(store.getState()[0].tabs.length).toBe(1);

      store.dispatch(updateTab(window.windowID, 'b', 'hoge', 'fuga'));

      const newState = store.getState();

      expect(newState[0].tabs.length).toBe(1);
      expect(newState[0].tabs[0].metaDataID).toBe('foo');
      expect(newState[0].tabs[0].content).toBe('bar');
    });
  });
});
