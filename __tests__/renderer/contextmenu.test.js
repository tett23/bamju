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
  [buffer] = dummyBuffers;
});

describe('ContextMenu', () => {
  describe('linkMenu', () => {
    it('metaDataIDがnull場合、null', () => {
      const template = ContextMenu.linkMenu(null);
      expect(template).toBe(null);
    });

    it('metaDataIDが存在しない場合、null', () => {
      const template = ContextMenu.linkMenu('hogehoge');
      expect(template).toBe(null);
    });

    it('metaDataIDが存在しない場合、messageが追加される', () => {
      expect(store.getState().messages.length).toBe(0);
      ContextMenu.linkMenu('hogehoge');
      expect(store.getState().messages.length).toBe(1);
    });
  });

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

  describe('openMenu', () => {
    describe('Open new tab', () => {
      it('Tabが追加される', () => {
        const template = ContextMenu.openMenu(buffer) || [];
        const menu = template.find((item) => {
          return item.label === 'Open new tab';
        });
        if (menu == null) {
          expect(true).toBe(false);
          return;
        }

        expect(store.getState().browser.tabs.length).toBe(1);
        menu.click();
        expect(store.getState().browser.tabs.length).toBe(2);
      });

      it('Open new tabはItemTypeUndefinedでないときのみ有効', () => {
        [
          [ItemTypeMarkdown, true],
          [ItemTypeText, true],
          [ItemTypeCSV, true],
          [ItemTypeTSV, true],
          [ItemTypeHTML, true],
          [ItemTypeDirectory, true],
          [ItemTypeRepository, true],
          [ItemTypeUndefined, false],
        ].forEach((pair) => {
          const [itemType, enabled] = pair;

          buffer.itemType = itemType;

          const template = ContextMenu.openMenu(buffer) || [];
          const menu = template.find((item) => {
            return item.label === 'Open new tab';
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

    it('Open new WindowはItemTypeUndefinedでないときのみ有効', () => {
      [
        [ItemTypeMarkdown, true],
        [ItemTypeText, true],
        [ItemTypeCSV, true],
        [ItemTypeTSV, true],
        [ItemTypeHTML, true],
        [ItemTypeDirectory, true],
        [ItemTypeRepository, true],
        [ItemTypeUndefined, false],
      ].forEach((pair) => {
        const [itemType, enabled] = pair;

        buffer.itemType = itemType;

        const template = ContextMenu.openMenu(buffer) || [];
        const menu = template.find((item) => {
          return item.label === 'Open new tab';
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
