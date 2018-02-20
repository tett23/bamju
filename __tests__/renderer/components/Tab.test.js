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
  addTab,
  updateTab,
} from '../../../app/actions/browser';
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
let buffer;
beforeEach(() => {
  store = createStore(appReducer, initialState());

  const dummyBuffers = dummy({
    test: ['/foo.md', '/a/b/c.md']
  });
  dummyBuffers.forEach((_, i) => {
    dummyBuffers[i].isOpened = true;
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

  it('Breadcrumbの内容が表示できる', () => {
    buffer.path = '/foo/bar/baz';

    const component = mountWithStore(<Tab id="foo" buffer={buffer} content="" />, store);
    const breadcrumbs = component.find('BreadcrumbItem');

    expect(breadcrumbs.length).toBe(4);
    expect(breadcrumbs.at(0).text()).toBe(buffer.repositoryName);
    expect(breadcrumbs.at(1).text()).toBe('foo');
    expect(breadcrumbs.at(2).text()).toBe('bar');
    expect(breadcrumbs.at(3).text()).toBe('baz');
  });

  describe('buildTabContextMenu', () => {
    it('メニューのテンプレートが作れる', () => {
      const contextMenu = buildTabContextMenu(buffer);

      expect(contextMenu[0].label).toBe('edit on system editor');
      expect(contextMenu[1].label).toBe('edit on bamju editor');
      expect(contextMenu[2].label).toBe('reload');
    });

    it('edit on bamju editorはisSimilarFileのときのみ有効', () => {
      const tab = store.getState().browser.tabs[0];

      [
        ItemTypeMarkdown,
        ItemTypeText,
        ItemTypeCSV,
        ItemTypeTSV,
        ItemTypeHTML
      ].forEach((itemType) => {
        buffer.itemType = itemType;
        store.dispatch(updateTab(tab.id, buffer.id, ''));
        const contextMenu = buildTabContextMenu(buffer);

        expect(contextMenu[1].enabled).toBe(true);
      });

      [
        ItemTypeRepository,
        ItemTypeDirectory,
        ItemTypeUndefined
      ].forEach((itemType) => {
        buffer.itemType = itemType;
        store.dispatch(updateTab(tab.id, buffer.id, ''));
        const contextMenu = buildTabContextMenu(buffer);

        expect(contextMenu[1].enabled).toBe(false);
      });
    });
  });

  // TODO breadcrumbのテスト. bootstrapの依存をなくす
});
