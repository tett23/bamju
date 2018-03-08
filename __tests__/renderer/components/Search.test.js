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
  search
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
    props = search('foo', null).payload;
    props.results = [{
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
    }];
  });

  it('messagesが空のときはMessageは作られない', () => {
    const component = mountWithStore(<Search {...props} />, store);

    component.find('.input').simulate('keyUp', {
      key: 'Enter'
    });
  });

  it('keyUp', () => {
    const component = mountWithStore(<Search {...props} />, store);

    expect(component.state('selectedIndex')).not.toBe(expect.anything());
    component.find('.input').simulate('keyUp', {
      key: 'Up'
    });
    expect(component.state('selectedIndex')).toBe(-1);
  });
});
