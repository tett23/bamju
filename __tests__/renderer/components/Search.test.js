// @flow

import * as React from 'react';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import {
  appReducer,
  initialState,
} from '../../../app/reducers/app_window';
import '../../global_config.test';
import { mountWithStore } from '../../test_utils';

import {
  search,
} from '../../../app/actions/searches';
import {
  openSearchDialog,
} from '../../../app/actions/modals';
import {
  Search,
} from '../../../app/renderer/components/Search';

let store;
beforeEach(() => {
  store = createStore(appReducer, initialState(), applyMiddleware(thunk));
});

describe('<Search />', () => {
  let props;
  beforeEach(() => {
    const searchAction = search('foo', null);
    store.dispatch(searchAction);
    store.dispatch(openSearchDialog(searchAction.payload.queryID));
    props = searchAction.payload;
    props.results = [
      {
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
        positions: [{
          size: 0,
          offset: 0
        }],
        detail: {
          text: 'foo',
          positions: [{
            size: 0,
            offset: 0
          }]
        }
      },
      {
        buffer: {
          id: 'bar',
          name: 'bar',
          path: '/bar',
          repositoryName: 'bar',
          repositoryPath: '/tmp/test/bar',
          absolutePath: '/tmp/test/foo/bar',
          itemType: 'directory',
          parentID: null,
          childrenIDs: [],
          isLoaded: true,
          body: ''
        },
        positions: [{
          size: 0,
          offset: 0
        }],
        detail: {
          text: 'foo',
          positions: [{
            size: 0,
            offset: 0
          }]
        }
      },
    ];
  });

  it('messagesが空のときはMessageは作られない', () => {
    const component = mountWithStore(<Search {...props} />, store);

    component.find('.input').simulate('keyDown', {
      key: 'Enter'
    });
  });

  describe('KeyDown', () => {
    let component;
    beforeEach(() => {
      component = mountWithStore(<Search {...props} />, store);

      expect(store.getState().searches[0].selectedIndex).toBe(null);
    });

    it('Ctrl+Enter', () => {
      expect(store.getState().modals.length).toBe(1);
      const tabLength = store.getState().browser.tabs.length;
      const currentTabID = store.getState().browser.currentTabID;

      component = mountWithStore(<Search {...props} selectedIndex={0} />, store);

      component.find('.input').simulate('keyDown', {
        key: 'Enter',
        ctrlKey: true,
      });

      expect(store.getState().modals.length).toBe(0);
      expect(store.getState().browser.tabs.length).toBe(tabLength + 1);
      expect(store.getState().browser.currentTabID).not.toBe(currentTabID);
    });

    it('Cmd+Enter', () => {
      expect(store.getState().modals.length).toBe(1);
      const tabLength = store.getState().browser.tabs.length;
      const currentTabID = store.getState().browser.currentTabID;

      component = mountWithStore(<Search {...props} selectedIndex={0} />, store);

      component.find('.input').simulate('keyDown', {
        key: 'Enter',
        metaKey: true,
      });

      expect(store.getState().modals.length).toBe(0);
      expect(store.getState().browser.tabs.length).toBe(tabLength + 1);
      expect(store.getState().browser.currentTabID).not.toBe(currentTabID);
    });

    it('Escape', () => {
      expect(store.getState().modals.length).toBe(1);
      component = mountWithStore(<Search {...props} selectedIndex={0} />, store);

      component.find('.input').simulate('keyDown', {
        key: 'Escape'
      });

      expect(store.getState().modals.length).toBe(0);
    });

    it('ArrowDown', () => {
      component = mountWithStore(<Search {...props} selectedIndex={0} />, store);

      component.find('.input').simulate('keyDown', {
        key: 'ArrowDown'
      });

      expect(store.getState().searches[0].selectedIndex).toBe(1);
    });

    it('ArrowUp', () => {
      component = mountWithStore(<Search {...props} selectedIndex={1} />, store);

      component.find('.input').simulate('keyDown', {
        key: 'ArrowUp'
      });

      expect(store.getState().searches[0].selectedIndex).toBe(0);
    });
  });
});
