/* eslint no-undef: 0 */

import {
  RepositoryManager,
} from '../../app/common/repository';
import {
  MetaData,
  ItemTypeMarkdown,
  ItemTypeText,
  ItemTypeCSV,
  ItemTypeTSV,
  ItemTypeHTML,
  ItemTypeRepository,
  ItemTypeDirectory,
  ItemTypeUndefined
} from '../../app/common/metadata';
import {
  MessageTypeFailed,
  MessageTypeSucceeded
} from '../../app/common/util';


import {
  createBufferTree,
} from '../test_utils';

jest.setTimeout(500);

describe('MetaData', () => {
  describe('detect', () => {
    beforeEach(() => {
      const root1 = createBufferTree('test', {
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
        },
        synonymTest: {
          foo: {
            synonym: {}
          },
          bar: {
            synonym: {}
          }
        },
        'detect self': {},
        rootItem: {},
        rootSynonym: {},
        濁点つきのファイル名ガ: {},
      });
      const root2 = createBufferTree('test2', {});

      RepositoryManager.init([root1, root2], [{
        repositoryName: 'test',
        absolutePath: '/tmp/bamju-test-test'
      }], {
        repositoryName: 'test2',
        absolutePath: '/tmp/bamju-test-test2'
      });
    });

    it('該当するアイテムを返す', () => {
      const item = RepositoryManager.detect('test', 'index');
      expect(item).toMatchObject({
        name: 'index',
        path: '/index'
      });
    });

    it('該当するアイテムがないときはnullを返す', () => {
      expect(RepositoryManager.detect('test', '該当しないファイル名')).not.toBe(expect.anything());
    });

    it('..を含むパスを渡したときはそれを解釈して該当するアイテムを返す', () => {
      const item = RepositoryManager.detect('test', '/a/b/c/..');
      expect(item).toMatchObject({
        name: 'b',
        path: '/a/b'
      });
    });

    it('/はルートのアイテムを取得する', () => {
      let rootItem = RepositoryManager.detect('test', '/');
      expect(rootItem).toMatchObject({
        name: '/',
        path: '/'
      });

      const item = rootItem.detect('deepItem');
      rootItem = item.detect('/');
      expect(rootItem).toMatchObject({
        name: '/',
        path: '/'
      });

      rootItem = RepositoryManager.detect('test', '/');
      rootItem = rootItem.detect('..');
      expect(rootItem).toMatchObject({
        name: '/',
        path: '/'
      });
    });

    it('.は現在のアイテムを取得する', () => {
      let item = RepositoryManager.detect('test', 'detect self');
      expect(item).toMatchObject({
        name: 'detect self',
        path: '/detect self'
      });

      item = item.detect('.');
      expect(item).toMatchObject({
        name: 'detect self',
        path: '/detect self'
      });
    });

    it('/に対して.を取得するとルートの取得ができる', () => {
      let rootItem = RepositoryManager.detect('test', '/');
      expect(rootItem).toMatchObject({
        name: '/',
        path: '/'
      });

      rootItem = rootItem.detect('.');
      expect(rootItem).toMatchObject({
        name: '/',
        path: '/'
      });
    });

    it('/../するとルートの取得ができる', () => {
      const rootItem = RepositoryManager.detect('test', '/../');
      expect(rootItem).toMatchObject({
        name: '/',
        path: '/'
      });
    });

    it('/で始まるものはルートから検索される', () => {
      const item = RepositoryManager.detect('test', '/foo/bar');
      expect(item).toMatchObject({
        name: 'bar',
        path: '/foo/bar'
      });
    });

    it('単体の文字列での検索は全てを検索する', () => {
      const item = RepositoryManager.detect('test', 'deepItem');
      expect(item).toMatchObject({
        name: 'deepItem',
        path: '/a/b/c/d/e/deepItem'
      });
    });

    it('相対パスのときは現在のアイテムから検索する', () => {
      let item = RepositoryManager.detect('test', '/foo/bar');
      expect(item).toMatchObject({
        name: 'bar',
        path: '/foo/bar'
      });

      item = item.detect('./baz/test1');
      expect(item).toMatchObject({
        name: 'test1',
        path: '/foo/bar/baz/test1'
      });

      item = item.parent;
      item = item.detect('./baz/test1');
      expect(item).toMatchObject({
        name: 'test1',
        path: '/foo/bar/baz/test1'
      });
    });

    it('/は含むが.で始まらないものはルートからの部分一致で検索する', () => {
      let item = RepositoryManager.detect('test', '/');

      item = item.detect('baz/test1');
      expect(item).toMatchObject({
        name: 'test1',
        path: '/foo/bar/baz/test1'
      });

      item = RepositoryManager.detect('test', 'e/deepItem');
      expect(item).toMatchObject({
        name: 'deepItem',
        path: '/a/b/c/d/e/deepItem'
      });

      item = RepositoryManager.detect('test', 'a/deepItem');
      expect(item).not.toBe(expect.anything());
    });

    it('.で始まるときは現在のアイテムから検索する', () => {
      const item = RepositoryManager.detect('test', '/synonymTest');
      expect(item).toMatchObject({
        name: 'synonymTest',
        path: '/synonymTest'
      });

      let synonym = item.detect('./bar/synonym');
      expect(synonym).toMatchObject({
        name: 'synonym',
        path: '/synonymTest/bar/synonym'
      });

      const parent = synonym.detect('../');
      synonym = parent.detect('./synonym');
      expect(synonym).toMatchObject({
        name: 'synonym',
        path: '/synonymTest/bar/synonym'
      });
    });

    // TODO
    // it('濁点とかを含んでいても検索できる(mac-utf8)', () => {
    //   expect(RepositoryManager.detect('test', '該当しないファイル名ガ')).toBeTruthy();
    // });
  });

  describe('addFile', () => {
    beforeEach(() => {
      const dummy = createBufferTree('test', {});
      RepositoryManager.init([dummy], [{
        repositoryName: 'test',
        absolutePath: '/tmp/bamju-test-test'
      }]);
    });

    it('ファイルの追加ができる', async () => {
      const rootItem = await RepositoryManager.find('test');
      const [metaData, result] = await rootItem.addFile('hoge.md');

      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData).toMatchObject({
        name: 'hoge.md',
        path: '/hoge.md',
        repositoryName: 'test',
        absolutePath: '/tmp/bamju-test-test/hoge.md',
        itemType: ItemTypeMarkdown,
        repositoryPath: '/tmp/bamju-test-test',
      });
    });

    it('有効な拡張子の場合はSucceededが返る', async () => {
      const rootItem = await RepositoryManager.find('test');
      const [_, result] = await rootItem.addFile('hoge.md');

      await expect(result.type).toBe(MessageTypeSucceeded);
    });

    it('無効な拡張子の場合Failedのメッセージが返る', async () => {
      const rootItem = await RepositoryManager.find('test');
      const [_, result] = await rootItem.addFile('foo.bar');

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('ItemTypeの判定をしてファイルの作成ができる', async () => {
      const rootItem = await RepositoryManager.find('test');

      let [metaData, result] = await rootItem.addFile('hoge.md');
      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData.itemType).toBe(ItemTypeMarkdown);

      [metaData, result] = await rootItem.addFile('hoge.txt');
      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData.itemType).toBe(ItemTypeText);

      [metaData, result] = await rootItem.addFile('hoge.csv');
      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData.itemType).toBe(ItemTypeCSV);

      [metaData, result] = await rootItem.addFile('hoge.tsv');
      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData.itemType).toBe(ItemTypeTSV);

      [metaData, result] = await rootItem.addFile('hoge.html');
      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData.itemType).toBe(ItemTypeHTML);
    });

    it('同名のファイルが存在していた場合、Failedのメッセージが返る', async () => {
      const rootItem = await RepositoryManager.find('test');
      let [_, result] = await rootItem.addFile('synonym.md');

      await expect(result.type).toBe(MessageTypeSucceeded);

      [_, result] = await rootItem.addFile('synonym.md');

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('path.sepを含むファイルを作ろうとするとFailedのメッセージが返る', async () => {
      const rootItem = await RepositoryManager.find('test');
      const testFileName = ['/foo/bar', 'a/b'];
      for (let i = 0; i < testFileName.length; i += 1) {
        const [_, result] = await rootItem.addFile(testFileName[i]);
        await expect(result.type).toBe(MessageTypeFailed);
      }
    });
  });

  describe('parent', () => {
    beforeEach(() => {
      const dummy = createBufferTree('test', {
        foo: {
          bar: {
            baz: {
              'testItem.md': {}
            }
          }
        }
      });
      RepositoryManager.init([dummy], [{
        repositoryName: 'test',
        absolutePath: '/tmp/bamju-test-test'
      }]);
    });

    it('親のアイテムを取得できる', () => {
      const item = RepositoryManager.detect('test', 'testItem');
      expect(item.parent.path).toBe('/foo/bar/baz');
    });

    it('this.path === "/"のときはnullを返す', () => {
      const item = RepositoryManager.detect('test', '/');
      expect(item.parent).not.toBe(expect.anything());
    });
  });

  describe('rootItem', () => {
    beforeEach(() => {
      const dummy = createBufferTree('test', {
        foo: {
          bar: {
            baz: {
              'testItem.md': {}
            }
          }
        }
      });
      RepositoryManager.init([dummy], [{
        repositoryName: 'test',
        absolutePath: '/tmp/bamju-test-test'
      }]);
    });

    it('ルートのアイテムが取得できる', () => {
      const item = RepositoryManager.detect('test', 'testItem');
      expect(item.rootItem().path).toBe('/');
    });

    it('ItemTypeUndefinedでも取得できる', () => {
      const item = RepositoryManager.detect('test', 'testItem');
      item.name = '';
      item.path = '';
      item.parent = [];
      item.itemType = ItemTypeUndefined;

      expect(item.rootItem().path).toBe('/');
    });

    it('repositoryが存在しない場合はErrorが投げられる', () => {
      const item = RepositoryManager.detect('test', 'testItem');
      item.repositoryName = '';

      expect(item.rootItem).toThrowError();
    });
  });

  describe('childItem', () => {
    // TODO
  });

  describe('isExist', () => {
    // TODO
  });

  const allTypes = [ItemTypeMarkdown, ItemTypeText, ItemTypeCSV, ItemTypeTSV, ItemTypeHTML, ItemTypeRepository, ItemTypeDirectory, ItemTypeUndefined];

  it('isSimilarFile', () => {
    const metaData = new MetaData({
      id: '',
      name: '/',
      path: '/',
      repositoryName: 'test',
      repositoryPath: '/tmp/test',
      absolutePath: '/tmp/test',
      itemType: ItemTypeRepository,
      isLoaded: false,
      isOpened: false,
      children: [],
      parent: null,
    });

    allTypes.forEach((itemType) => {
      metaData.itemType = itemType;

      switch (itemType) {
      case ItemTypeMarkdown:
        return expect(metaData.isSimilarFile()).toBe(true);
      case ItemTypeText:
        return expect(metaData.isSimilarFile()).toBe(true);
      case ItemTypeCSV:
        return expect(metaData.isSimilarFile()).toBe(true);
      case ItemTypeTSV:
        return expect(metaData.isSimilarFile()).toBe(true);
      case ItemTypeHTML:
        return expect(metaData.isSimilarFile()).toBe(true);
      case ItemTypeRepository:
        return expect(metaData.isSimilarFile()).toBe(false);
      case ItemTypeDirectory:
        return expect(metaData.isSimilarFile()).toBe(false);
      case ItemTypeUndefined:
        return expect(metaData.isSimilarFile()).toBe(false);
      default:
        return expect(true).toBe(false);
      }
    });
  });

  it('isSimilarDirectory', () => {
    const metaData = new MetaData({
      id: '',
      name: '/',
      path: '/',
      repositoryName: 'test',
      repositoryPath: '/tmp/test',
      absolutePath: '/tmp/test',
      itemType: ItemTypeRepository,
      isLoaded: false,
      isOpened: false,
      children: [],
      parent: null,
    });

    allTypes.forEach((itemType) => {
      metaData.itemType = itemType;


      switch (itemType) {
      case ItemTypeMarkdown:
        return expect(metaData.isSimilarDirectory()).toBe(false);
      case ItemTypeText:
        return expect(metaData.isSimilarDirectory()).toBe(false);
      case ItemTypeCSV:
        return expect(metaData.isSimilarDirectory()).toBe(false);
      case ItemTypeTSV:
        return expect(metaData.isSimilarDirectory()).toBe(false);
      case ItemTypeHTML:
        return expect(metaData.isSimilarDirectory()).toBe(false);
      case ItemTypeRepository:
        return expect(metaData.isSimilarDirectory()).toBe(true);
      case ItemTypeDirectory:
        return expect(metaData.isSimilarDirectory()).toBe(true);
      case ItemTypeUndefined:
        return expect(metaData.isSimilarDirectory()).toBe(false);
      default:
        return expect(true).toBe(false);
      }
    });
  });
});
