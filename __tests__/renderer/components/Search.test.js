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
  updateSelectedIndex,
} from '../../../app/actions/searches';
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
        position: {
          size: 0,
          offset: 0
        },
        detail: {
          text: 'foo',
          position: {
            size: 0,
            offset: 0
          }
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
        position: {
          size: 0,
          offset: 0
        },
        detail: {
          text: 'foo',
          position: {
            size: 0,
            offset: 0
          }
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
