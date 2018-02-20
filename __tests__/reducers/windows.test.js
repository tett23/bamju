// @flow

import { createStore } from 'redux';

import {
  initialWindowsState,
  windows,
} from '../../app/reducers/windows';
import {
  initializeWindows,
  newWindow,
  closeWindow,
  updateWindowRectangle,
} from '../../app/actions/windows';

let store;
beforeEach(() => {
  store = createStore(windows, initialWindowsState());
});

describe('windows reducer', () => {
  describe('INITIALIZE_WINDOWS', () => {
    it('windowsの初期化ができる', () => {
      expect(store.getState().length).toBe(0);

      const init = [{
        id: 'foo',
        rectangle: {
          x: 1,
          y: 2,
          width: 3,
          height: 4
        },
        tabs: [{
          id: 'aa',
          metaDataID: 'bb',
          content: 'cc'
        }]
      }];
      store.dispatch(initializeWindows(init));

      expect(store.getState()).toMatchObject(init);
    });

    it('stateが空なら初期化後も空', () => {
      expect(store.getState().length).toBe(0);

      store.dispatch(initializeWindows([]));

      expect(store.getState().length).toBe(0);
    });
  });

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
      store.dispatch(closeWindow(window.payload.windowID));

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
      store.dispatch(updateWindowRectangle(window.payload.windowID, rectangle));

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
});
