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
    const childKeys = Object.keys(items[key]);
    const itemType = childKeys.length === 0 ? ItemTypeMarkdown : ItemTypeDirectory;
    const childItems:Array<BufferItem> = childKeys.map((childKey) => {
      // console.log('childKey', childKey);
      if (Object.keys(items[key][childKey]).length === 0) {
        const c = {};
        c[childKey] = {};
        return dummy(path.join(parentPath, key), c)[0];
      }

      const r = dummy(path.join(parentPath, key), items[key])[0];
      return r;
    });

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
        foo: {
          bar: {
            hoge: {
              a: {
                b: {
                  c: {
                    d: {}
                  }
                }
              }
            }
          },
          baz: {
            test1: {
              rootSynonym: {}
            }
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
        rootSynonym: {},
        濁点つきのファイル名ガ: {},
      });
      const root = dummyBufferItem({
        name: 'test',
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
        name: 'test2',
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
      const item = Manager.detect('test', '/foo/bar/hoge/a/b/../');
      expect(item).toBeTruthy();
      expect(item.name).toBe('a');
      expect(item.path).toBe('/foo/bar/hoge/a');
    });

    // 現在のアイテムから検索
    it('ProjectItemから呼んだ場合は、そのアイテム以下から検索する', () => {
      let item = Manager.detect('test', '/rootSynonym');
      expect(item).toBeTruthy();
      expect(item.name).toBe('rootSynonym');
      expect(item.path).toBe('/rootSynonym');

      item = Manager.detect('test', 'test1');
      expect(item).toBeTruthy();
      expect(item.name).toBe('rootSynonym');
      expect(item.path).toBe('/foo/baz/test1/rootSynonym');

      item = Manager.detect('test', 'test1/../');
      expect(item).toBeTruthy();
      expect(item.name).toBe('baz');
      expect(item.path).toBe('/foo/baz');
    });
    // 現在のアイテムに..を含むとき

    it('/で始まるものはルートから検索される', () => {
      const item = Manager.detect('test', '/foo/bar');
      expect(item).toBeTruthy();
      expect(item.name).toBe('bar');
      expect(item.path).toBe('/foo/bar');
    });

    // it('濁点とかを含んでいても検索できる(mac-utf8)', () => {
    //   expect(Manager.detect('test', '該当しないファイル名ガ')).toBeTruthy();
    // });
  });
});
