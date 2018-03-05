// @flow

import { createStore } from 'redux';

import '../global_config.test';
import {
  dummy,
} from '../test_utils';

import {
  ItemTypeMarkdown,
  ItemTypeText,
  ItemTypeCSV,
  ItemTypeTSV,
  ItemTypeHTML,
  ItemTypeRepository,
  ItemTypeDirectory,
  ItemTypeUndefined,
} from '../../app/common/metadata';
import {
  appReducer,
  initialState,
} from '../../app/reducers/app_window';
import {
  reloadBuffers,
} from '../../app/actions/buffers';
import {
  type Buffer
} from '../../app/common/buffer';
import {
  setStore,
  ContextMenu,
} from '../../app/renderer/contextmenu';

let store;
let buffer:Buffer;
beforeEach(() => {
  store = createStore(appReducer, initialState());
  setStore(store);

  const dummyBuffers = dummy({
    test: ['/foo.md', '/a/b/c.md']
  });

  store.dispatch(reloadBuffers(dummyBuffers));
  buffer = dummyBuffers[0];
});

describe('ContextMenu', () => {
  describe('editMenu', () => {
    it('組みこみエディタで開くのメニューはisSimilarFileのときだけ有効', () => {
      [
        [ItemTypeMarkdown, true],
        [ItemTypeText, true],
        [ItemTypeCSV, true],
        [ItemTypeTSV, true],
        [ItemTypeHTML, true],
        [ItemTypeDirectory, false],
        [ItemTypeRepository, false],
        [ItemTypeUndefined, false],
      ].forEach((pair) => {
        const [itemType, enabled] = pair;

        buffer.itemType = itemType;

        const template = ContextMenu.editMenu(buffer) || [];
        const menu = template.find((item) => {
          return item.label === 'Edit on bamju editor';
        });
        if (menu == null) {
          expect(true).toBe(false);
          return;
        }

        // $FlowFixMe
        expect(menu.enabled).toBe(enabled);
      });
    });
  });

  describe('repositoyMenu', () => {
    it('リポジトリを削除のメニューはitemType == ItemTypeRepositoryのときだけ有効', () => {
      [
        [ItemTypeMarkdown, false],
        [ItemTypeText, false],
        [ItemTypeCSV, false],
        [ItemTypeTSV, false],
        [ItemTypeHTML, false],
        [ItemTypeDirectory, false],
        [ItemTypeRepository, true],
        [ItemTypeUndefined, false],
      ].forEach((pair) => {
        const [itemType, enabled] = pair;

        buffer.itemType = itemType;

        const template = ContextMenu.repositoryMenu(buffer) || [];
        const menu = template.find((item) => {
          return item.label === 'Remove Repository';
        });
        if (menu == null) {
          expect(true).toBe(false);
          return;
        }

        // $FlowFixMe
        expect(menu.enabled).toBe(enabled);
      });
    });
  });
});
