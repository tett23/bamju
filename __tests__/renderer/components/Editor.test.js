// @flow

import * as React from 'react';
import { createStore } from 'redux';

import '../../global_config.test';
import { mountWithStore } from '../../test_utils';

import {
  appReducer,
  initialState,
} from '../../../app/reducers/editor_combined';
import {
  openBuffer,
} from '../../../app/actions/editor';
import {
  ItemTypeMarkdown
} from '../../../app/common/metadata';

import {
  Editor,
} from '../../../app/renderer/components/Editor';

let store;
beforeEach(() => {
  store = createStore(appReducer, initialState());
});

describe('<Editor />', () => {
  it('contentの内容が表示できる', () => {
    const { buffer, content } = store.getState().editor;
    store.dispatch(openBuffer(buffer, 'hogehoge'));

    const component = mountWithStore(<Editor buffer={buffer} content={content} />, store);

    expect(component.find('ReactAce').props().mode).toBe('text');
    expect(component.find('ReactAce').props().value).toBe('hogehoge');
  });

  it('ItemTypeMarkdownを判定できる', () => {
    const { buffer, content } = store.getState().editor;
    buffer.itemType = ItemTypeMarkdown;
    store.dispatch(openBuffer(buffer, 'hogehoge'));

    const component = mountWithStore(<Editor buffer={buffer} content={content} />, store);

    expect(component.find('ReactAce').props().mode).toBe('markdown');
    expect(component.find('ReactAce').props().value).toBe('hogehoge');
  });
});
