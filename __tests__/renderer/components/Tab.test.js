// @flow

import * as React from 'react';
import { createStore } from 'redux';

import '../../global_config.test';
import { mountWithStore } from '../../test_utils';

import {
  appReducer,
  initialState,
} from '../../../app/reducers/combined';
import {
  openBuffer,
} from '../../../app/actions/tab';
import {
  ItemTypeMarkdown,
  ItemTypeText,
  ItemTypeCSV,
  ItemTypeTSV,
  ItemTypeHTML,
  ItemTypeRepository,
  ItemTypeDirectory,
  ItemTypeUndefined,
} from '../../../app/common/metadata';

import {
  Tab,
  buildTabContextMenu
} from '../../../app/renderer/components/Tab';

let store;
beforeEach(() => {
  store = createStore(appReducer, initialState());
});

describe('<Tab />', () => {
  it('contentの内容が表示できる', () => {
    const tab = store.getState().browser.tabs[0];
    store.dispatch(openBuffer(tab.buffer, 'hogehoge'));

    const component = mountWithStore(<Tab buffer={tab.buffer} content={tab.content} />, store);

    expect(component.find('.markdown-body').text()).toBe('hogehoge');
  });

  it('Breadcrumbの内容が表示できる', () => {
    const tab = store.getState().browser.tabs[0];
    tab.buffer.path = '/foo/bar/baz';
    store.dispatch(openBuffer(tab.buffer, 'hogehoge'));

    const component = mountWithStore(<Tab buffer={tab.buffer} content={tab.content} />, store);

    expect(component.find('.markdown-body').text()).toBe('hogehoge');
  });

  describe('buildTabContextMenu', () => {
    it('メニューのテンプレートが作れる', () => {
      const tab = store.getState().browser.tabs[0];
      const contextMenu = buildTabContextMenu(tab.buffer);

      expect(contextMenu[0].label).toBe('edit on system editor');
      expect(contextMenu[1].label).toBe('edit on bamju editor');
      expect(contextMenu[2].label).toBe('reload');
    });

    it('edit on bamju editorはisSimilarFileのときのみ有効', () => {
      [
        ItemTypeMarkdown,
        ItemTypeText,
        ItemTypeCSV,
        ItemTypeTSV,
        ItemTypeHTML
      ].forEach((itemType) => {
        const { buffer } = initialState().browser.tabs[0];
        buffer.itemType = itemType;
        store.dispatch(openBuffer(buffer, ''));
        const contextMenu = buildTabContextMenu(buffer);

        expect(contextMenu[1].enabled).toBe(true);
      });

      [
        ItemTypeRepository,
        ItemTypeDirectory,
        ItemTypeUndefined
      ].forEach((itemType) => {
        const { buffer } = initialState().browser.tabs[0];
        buffer.itemType = itemType;
        store.dispatch(openBuffer(buffer, ''));
        const contextMenu = buildTabContextMenu(buffer);

        expect(contextMenu[1].enabled).toBe(false);
      });
    });
  });

  // TODO breadcrumbのテスト. bootstrapの依存をなくす
});
