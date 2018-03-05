// @flow

import * as React from 'react';
import { createStore } from 'redux';

import '../../global_config.test';
import {
  mountWithStore,
  dummy,
} from '../../test_utils';

import {
  appReducer,
  initialState,
} from '../../../app/reducers/app_window';
import {
  reloadBuffers,
} from '../../../app/actions/buffers';
import {
  openBuffer,
} from '../../../app/actions/repositories_tree_view';
import {
  addTab,
} from '../../../app/actions/browser';

import {
  Tab,
} from '../../../app/renderer/components/Tab';

let store;
let buffer;
beforeEach(() => {
  store = createStore(appReducer, initialState());

  const dummyBuffers = dummy({
    test: ['/foo.md', '/a/b/c.md']
  });
  dummyBuffers.forEach((item) => {
    store.dispatch(openBuffer(item.id));
  });
  buffer = dummyBuffers[0]; // eslint-disable-line

  store.dispatch(reloadBuffers(dummyBuffers));
  store.dispatch(addTab(buffer.id, 'bar'));
});

describe('<Tab />', () => {
  it('contentの内容が表示できる', () => {
    const component = mountWithStore(<Tab id="foo" buffer={buffer} content="hogehoge" />, store);

    expect(component.find('.markdown-body').text()).toBe('hogehoge');
  });
});
