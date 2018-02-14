// @flow

import * as React from 'react';
import { createStore } from 'redux';

import '../../global_config.test';
import {
  mountWithStore,
  dummy,
  createDummyBufferByPath,
} from '../../test_utils';

import {
  appReducer,
  initialState,
} from '../../../app/renderer/reducers/combined';
import {
  reloadRepositories,
} from '../../../app/renderer/actions/repositories';
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
  RepositoriesTreeView,
  buildContextMenu,
} from '../../../app/renderer/components/RepositoriesTreeView';

let store;
beforeEach(() => {
  store = createStore(appReducer, initialState());

  const dummyBuffers = dummy({
    test: ['/foo.md', '/a/b/c.md']
  });

  dummyBuffers.test.forEach((_, i) => {
    dummyBuffers.test[i].isOpened = true;
  });
  const buffers = Object.keys(dummyBuffers).reduce((r, k) => {
    return r.concat(dummyBuffers[k]);
  }, []);

  store.dispatch(reloadRepositories(buffers));
});

describe('<RepositoriesTreeView />', () => {
  it('TreeViewの構築ができる', () => {
    const { repositories } = store.getState();

    const component = mountWithStore(<RepositoriesTreeView repositories={repositories} />, store);

    const items = component.find('.repositoryItem');
    const names = items.at(0).find('.repositoryItem > li > div > span');
    expect(names.at(0).text()).toBe('/');
    expect(names.at(1).text()).toBe('foo.md');
  });

  it('ItemTypeにもとづいてアイコンが設定される', () => {
    [
      [ItemTypeMarkdown, 'file-text'],
      [ItemTypeText, 'file-text'],
      [ItemTypeCSV, 'file-text'],
      [ItemTypeTSV, 'file-text'],
      [ItemTypeHTML, 'file-text'],
      [ItemTypeDirectory, 'folder-open'],
      [ItemTypeRepository, 'database'],
      [ItemTypeUndefined, 'question-circle'],
    ].forEach((pair) => {
      const buf = store.getState().repositories.buffers.find((b) => {
        return b.name === 'a';
      });
      if (buf == null) {
        expect(true).toBe(false);
        return;
      }
      const [itemType, className] = pair;
      buf.itemType = itemType;

      const component = mountWithStore(<RepositoriesTreeView repositories={store.getState().repositories} />, store);

      const items = component.find('.repositoryItem').findWhere((item) => {
        return item.key() === buf.id;
      }).find('FontAwesome');
      expect(items.at(0).prop('name')).toBe(className);
    });
  });

  it('isOpenedにもとづいてアイコンが設定される', () => {
    const buf = store.getState().repositories.buffers.find((b) => {
      return b.name === 'a';
    });
    if (buf == null) {
      expect(true).toBe(false);
      return;
    }
    buf.isOpened = false;

    let component = mountWithStore(<RepositoriesTreeView repositories={store.getState().repositories} />, store);

    let items = component.find('.repositoryItem').findWhere((item) => {
      return item.key() === buf.id;
    }).find('FontAwesome');
    expect(items.at(0).prop('name')).toBe('folder');

    store.getState().repositories.buffers[1].isOpened = true;

    component = mountWithStore(<RepositoriesTreeView repositories={store.getState().repositories} />, store);

    items = component.find('.repositoryItem').findWhere((item) => {
      return item.key() === buf.id;
    }).find('FontAwesome');
    expect(items.at(0).prop('name')).toBe('folder-open');
  });

  it('isOpened == trueのときは子のアイテムが作られる', () => {
    const buf = store.getState().repositories.buffers.find((b) => {
      return b.name === 'a';
    });
    if (buf == null) {
      expect(true).toBe(false);
      return;
    }
    buf.isOpened = true;

    const component = mountWithStore(<RepositoriesTreeView repositories={store.getState().repositories} />, store);

    const repositoryItem = component.findWhere((item) => {
      return item.key() === buf.id;
    });
    const children = repositoryItem.children().find('.repositoryItem');

    expect(children.length).not.toBe(0);
  });

  it('isOpened == falseのときは子のアイテムが作られない', () => {
    const buf = store.getState().repositories.buffers.find((b) => {
      return b.name === 'a';
    });
    if (buf == null) {
      expect(true).toBe(false);
      return;
    }
    buf.isOpened = false;

    const component = mountWithStore(<RepositoriesTreeView repositories={store.getState().repositories} />, store);

    const repositoryItem = component.findWhere((item) => {
      return item.key() === buf.id;
    });
    const children = repositoryItem.children().find('.repositoryItem');

    expect(children.length).toBe(0);
  });
});

describe('buildContextMenu', () => {
  it('組みこみエディタで開くのメニューはisSimilarFileのときだけ有効', () => {
    const buffer = createDummyBufferByPath('test', '/foo.md');
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

      const template = buildContextMenu(buffer);
      const menu = template.find((item) => {
        return item.label === 'edit on bamju editor';
      });
      if (menu == null) {
        expect(true).toBe(false);
        return;
      }

      // $FlowFixMe
      expect(menu.enabled).toBe(enabled);
    });
  });

  it('リポジトリを削除のメニューはitemType == ItemTypeRepositoryのときだけ有効', () => {
    const buffer = createDummyBufferByPath('test', '/foo.md');
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

      const template = buildContextMenu(buffer);
      const menu = template.find((item) => {
        return item.label === 'remove';
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
