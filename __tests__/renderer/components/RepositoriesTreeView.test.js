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
} from '../../../app/reducers/app_window';
import {
  reloadBuffers,
} from '../../../app/actions/buffers';
import {
  openBuffer,
  closeBuffer,
} from '../../../app/actions/repositories_tree_view';
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
} from '../../../app/renderer/components/RepositoriesTreeView';

let store;
beforeEach(() => {
  store = createStore(appReducer, initialState());

  const dummyBuffers = dummy({
    test: ['/foo.md', '/a/b/c.md']
  });

  store.dispatch(reloadBuffers(dummyBuffers));
  const rootItem = dummyBuffers.find((item) => {
    return item.itemType === ItemTypeRepository;
  });
  // $FlowFixMe
  store.dispatch(openBuffer(rootItem.id));
});

describe('<RepositoriesTreeView />', () => {
  it('TreeViewの構築ができる', () => {
    const component = mountWithStore(<RepositoriesTreeView buffers={store.getState().global.buffers} />, store);

    const items = component.find('.repositoryItem');
    const names = items.at(0).find('.repositoryItem > li > div > span');
    expect(names.at(0).text()).toBe('test');
    expect(names.at(1).text()).toBe('foo.md');
  });

  it('ItemTypeにもとづいてアイコンが設定される', () => {
    [
      [ItemTypeMarkdown, 'file-text'],
      [ItemTypeText, 'file-text'],
      [ItemTypeCSV, 'file-text'],
      [ItemTypeTSV, 'file-text'],
      [ItemTypeHTML, 'file-text'],
      [ItemTypeDirectory, 'folder'],
      [ItemTypeRepository, 'database'],
      [ItemTypeUndefined, 'question-circle'],
    ].forEach((pair) => {
      const buf = store.getState().global.buffers.find((b) => {
        return b.name === 'a';
      });
      if (buf == null) {
        expect(true).toBe(false);
        return;
      }
      const [itemType, className] = pair;
      buf.itemType = itemType;

      const component = mountWithStore(<RepositoriesTreeView buffers={store.getState().global.buffers} />, store);

      const items = component.find('.repositoryItem').findWhere((item) => {
        return item.key() === buf.id;
      }).find('FontAwesome');
      expect(items.at(0).prop('name')).toBe(className);
    });
  });

  it('isOpenedにもとづいてアイコンが設定される', () => {
    const buf = store.getState().global.buffers.find((b) => {
      return b.name === 'a';
    });
    if (buf == null) {
      expect(true).toBe(false);
      return;
    }
    store.dispatch(closeBuffer(buf.id));

    let component = mountWithStore(
      <RepositoriesTreeView
        buffers={store.getState().global.buffers}
        treeView={store.getState().repositoriesTreeView}
      />
      , store
    );

    let items = component.find('.repositoryItem').findWhere((item) => {
      return item.key() === buf.id;
    }).find('FontAwesome');
    expect(items.at(0).prop('name')).toBe('folder');

    store.dispatch(openBuffer(buf.id));

    component = mountWithStore(
      <RepositoriesTreeView
        buffers={store.getState().global.buffers}
        treeView={store.getState().repositoriesTreeView}
      />
      , store
    );

    items = component.find('.repositoryItem').findWhere((item) => {
      return item.key() === buf.id;
    }).find('FontAwesome');
    expect(items.at(0).prop('name')).toBe('folder-open');
  });

  it('isOpened == trueのときは子のアイテムが作られる', () => {
    const buf = store.getState().global.buffers.find((b) => {
      return b.name === 'a';
    });
    if (buf == null) {
      expect(true).toBe(false);
      return;
    }
    store.dispatch(openBuffer(buf.id));

    const component = mountWithStore(
      <RepositoriesTreeView
        buffers={store.getState().global.buffers}
        treeView={store.getState().repositoriesTreeView}
      />
      , store
    );

    const repositoryItem = component.findWhere((item) => {
      return item.key() === buf.id;
    });
    const children = repositoryItem.children().find('.repositoryItem');

    expect(children.length).not.toBe(0);
  });

  it('isOpened == falseのときは子のアイテムが作られない', () => {
    const buf = store.getState().global.buffers.find((b) => {
      return b.name === 'a';
    });
    if (buf == null) {
      expect(true).toBe(false);
      return;
    }
    store.dispatch(closeBuffer(buf.id));

    const component = mountWithStore(
      <RepositoriesTreeView
        buffers={store.getState().global.buffers}
        treeView={store.getState().repositoriesTreeView}
      />
      , store
    );

    const repositoryItem = component.findWhere((item) => {
      return item.key() === buf.id;
    });
    const children = repositoryItem.children().find('.repositoryItem');

    expect(children.length).toBe(0);
  });
});
