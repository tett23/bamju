// @flow
/* eslint no-undef: 0, no-cond-assign: 0, no-await-in-loop: 0, no-param-reassign: 0 */

import path from 'path';

import {
  Manager,
  // ProjectItem,
  type BufferItem,
  type ItemType,
  ItemTypeMarkdown,
  ItemTypeDirectory,
  ItemTypeProject
} from '../../app/common/project';

jest.setTimeout(500);
global.Promise = require.requireActual('promise');

type DummyBuffer = {
  name?: string,
  path?: string,
  projectName?: string,
  absolutePath?: string,
  itemType?: ItemType,
  projectPath?: string,
  isLoaded?: boolean,
  isOpened?: boolean,
  items?: Array<BufferItem>
};

function dummyBufferItem(obj: DummyBuffer = {}): BufferItem {
  return Object.assign({}, {
    name: 'test',
    projectName: 'test',
    projectPath: '/tmp',
    path: '',
    absolutePath: '',
    itemType: ItemTypeMarkdown,
    items: [],
    isLoaded: true,
    isOpened: false
  }, obj);
}

type dummyType = {
  [_: string]: dummyType
}

function dummy(parentPath:string, items: dummyType): Array<BufferItem> {
  return Object.keys(items).map((key) => {
    const name = path.basename(key);
    const itemPath = path.join(parentPath, key);
    const itemType = items[key].length === 0 ? ItemTypeMarkdown : ItemTypeDirectory;
    const childItems = dummy(path.join(parentPath, key), items[key]);
    // console.log('childItems', itemPath, childItems);

    return dummyBufferItem({
      name,
      path: itemPath,
      absolutePath: path.join('/tmp', itemPath),
      itemType,
      isLoaded: true,
      items: childItems,
    });
  });
}

describe('dummyTest', () => {
  it('ダミーデータの作成', () => {
    let item = dummy('/', { hoge: {} });
    expect(item.length).toBe(1);
    expect(item[0].name).toBe('hoge');
    expect(item[0].path).toBe('/hoge');

    item = dummy('/', { hoge: {}, fuga: {} });
    expect(item.length).toBe(2);
    expect(item[0].name).toBe('hoge');
    expect(item[0].path).toBe('/hoge');
    expect(item[1].name).toBe('fuga');
    expect(item[1].path).toBe('/fuga');

    item = dummy('/', { a: { b: { c: {} } } });
    expect(item.length).toBe(1);
    expect(item[0].name).toBe('a');
    expect(item[0].path).toBe('/a');
    expect(item[0].items.length).toBe(1);
    expect(item[0].items[0].name).toBe('b');
    expect(item[0].items[0].path).toBe('/a/b');
    expect(item[0].items[0].items.length).toBe(1);
    expect(item[0].items[0].items[0].name).toBe('c');
    expect(item[0].items[0].items[0].path).toBe('/a/b/c');
  });
});

describe('Manager', () => {
  beforeEach(() => {
  });
});

describe('ProjectItem', () => {
  beforeEach(() => {
  });

  describe('detect', () => {
    beforeEach(() => {
      const dummyBufferItems = dummy('/', {
        index: {},
        a: {
          b: {
            c: {
              d: {
                e: {
                  deepItem: {}
                }
              }
            }
          }
        },
        foo: {
          bar: {
            baz: {
              test1: {}
            },
          },
          'relative path test': {
            test1: {},
          },
          synonymTest: {
            foo: {
              synonym: {}
            },
            bar: {
              synonym: {}
            }
          }
        },
        'detect self': {},
        rootItem: {},
        rootSynonym: {},
        濁点つきのファイル名ガ: {},
      });
      const root = dummyBufferItem({
        name: '/',
        projectName: 'test',
        projectPath: '/tmp',
        path: '/',
        absolutePath: '/tmp',
        itemType: ItemTypeProject,
        items: [],
        isLoaded: true,
        isOpened: true
      });
      const root2 = dummyBufferItem({
        name: '/',
        projectName: 'test2',
        projectPath: '/tmp',
        path: '/',
        absolutePath: '/tmp',
        itemType: ItemTypeProject,
        items: [],
        isLoaded: true,
        isOpened: true
      });

      root.items = dummyBufferItems;
      // console.log(JSON.stringify(root, undefined, 2));
      Manager.clear();
      Manager.loadBufferItems([root, root2]);
    });

    it('該当するアイテムを返す', () => {
      const item = Manager.detect('test', 'index');
      expect(item).toBeTruthy();
      expect(item.name).toBe('index');
      expect(item.path).toBe('/index');
    });

    it('該当するアイテムがないときはnullを返す', () => {
      expect(Manager.detect('test', '該当しないファイル名')).toBeFalsy();
    });

    it('..を含むパスを渡したときはそれを解釈して該当するアイテムを返す', () => {
      const item = Manager.detect('test', '/a/b/c/..');
      expect(item).toBeTruthy();
      expect(item.name).toBe('b');
      expect(item.path).toBe('/a/b');
    });

    it('/はルートのアイテムを取得する', () => {
      let rootItem = Manager.detect('test', '/');
      expect(rootItem).toBeTruthy();
      expect(rootItem.path).toBe('/');

      const item = rootItem.detect('deepItem');
      rootItem = item.detect('/');
      expect(rootItem).toBeTruthy();
      expect(rootItem.name).toBe('/');
      expect(rootItem.path).toBe('/');

      rootItem = Manager.detect('test', '/');
      rootItem = rootItem.detect('..');
      expect(rootItem).toBeTruthy();
      expect(rootItem.path).toBe('/');
    });

    it('/で始まるものはルートから検索される', () => {
      const item = Manager.detect('test', '/foo/bar');
      expect(item).toBeTruthy();
      expect(item.name).toBe('bar');
      expect(item.path).toBe('/foo/bar');
    });

    it('単体の文字列での検索は全てを検索する', () => {
      const item = Manager.detect('test', 'deepItem');
      expect(item).toBeTruthy();
      expect(item.name).toBe('deepItem');
      expect(item.path).toBe('/a/b/c/d/e/deepItem');
    });

    it('相対パスのときは現在のアイテムから検索する', () => {
      let item = Manager.detect('test', '/foo/bar');
      expect(item).toBeTruthy();
      expect(item.name).toBe('bar');
      expect(item.path).toBe('/foo/bar');

      item = item.detect('./baz/test1');
      expect(item).toBeTruthy();
      expect(item.name).toBe('test1');
      expect(item.path).toBe('/foo/bar/baz/test1');

      item = item.parent();
      console.log('\n\n\n\n');
      console.log('/で始まるものはルートから検索される');
      item = item.detect('./baz/test1');
      expect(item).toBeTruthy();
      expect(item.name).toBe('test1');
      expect(item.path).toBe('/baz/test1');
    });

    it('/は含むが.で始まらないものはルートからの部分一致で検索する', () => {
      let item = Manager.detect('test', '/');

      item = item.detect('baz/test1');
      expect(item).toBeTruthy();
      expect(item.name).toBe('test1');
      expect(item.path).toBe('/foo/bar/baz/test1');

      item = Manager.detect('test', 'e/deepItem');
      expect(item).toBeTruthy();
      expect(item.name).toBe('deepItem');
      expect(item.path).toBe('/a/b/c/d/e/deepItem');

      item = Manager.detect('test', 'a/deepItem');
      expect(item).toBeFalsy();
    });

    it('.で始まるときは現在のアイテムから検索する', () => {
      const item = Manager.detect('test', '/foo/relative path test');
      expect(item).toBeTruthy();
      expect(item.name).toBe('relative path test');
      expect(item.path).toBe('/foo/relative path test');

      const test1 = item.detect('./test1');
      expect(test1).toBeTruthy();
      expect(test1.name).toBe('test1');
      expect(test1.path).toBe('/foo/relative path test/test1');

      expect(item.detect('../relative path test')).toBeTruthy();
      expect(item.detect('../relative path test').path).toBe('/foo/relative path test');
    });

    it('.は現在のアイテムを取得する', () => {
    });

    it('/に対して.を取得するとルートの取得ができる', () => {
    });

    // it('濁点とかを含んでいても検索できる(mac-utf8)', () => {
    //   expect(Manager.detect('test', '該当しないファイル名ガ')).toBeTruthy();
    // });
  });
});
