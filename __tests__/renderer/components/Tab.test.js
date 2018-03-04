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

  describe('buildTabContextMenu', () => {
    it('メニューのテンプレートが作れる', () => {
      const contextMenu = buildTabContextMenu({
        buffer,
        id: '',
        content: '',
      });

      expect(contextMenu[0].label).toBe('edit on system editor');
      expect(contextMenu[1].label).toBe('edit on bamju editor');
      expect(contextMenu[2].label).toBe('reload');
    });

    it('edit on bamju editorはisSimilarFileのときのみ有効', () => {
      const tab = store.getState().browser.tabs[0];
      const props = {
        buffer,
        id: '',
        content: '',
      };

      [
        ItemTypeMarkdown,
        ItemTypeText,
        ItemTypeCSV,
        ItemTypeTSV,
        ItemTypeHTML
      ].forEach((itemType) => {
        buffer.itemType = itemType;
        store.dispatch(updateTab(tab.id, buffer.id, ''));
        const contextMenu = buildTabContextMenu(props);

        expect(contextMenu[1].enabled).toBe(true);
      });

      [
        ItemTypeRepository,
        ItemTypeDirectory,
        ItemTypeUndefined
      ].forEach((itemType) => {
        buffer.itemType = itemType;
        store.dispatch(updateTab(tab.id, buffer.id, ''));
        const contextMenu = buildTabContextMenu(props);

        expect(contextMenu[1].enabled).toBe(false);
      });
    });
  });

  // TODO breadcrumbのテスト. bootstrapの依存をなくす
});
