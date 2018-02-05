/* eslint no-undef: 0 */

import path from '../../app/common/path';

import {
  RepositoryManager,
  ItemTypeMarkdown,
  ItemTypeText,
  ItemTypeCSV,
  ItemTypeTSV,
  ItemTypeHTML
} from '../../app/common/repository';
import {
  MessageTypeFailed,
  MessageTypeSucceeded
} from '../../app/common/util';


import {
  createBufferTree,
} from '../test_utils';

jest.setTimeout(500);


describe('RepositoryManager', () => {
  describe('init', () => {
    it('引数が空なら値も空になる', async () => {
      const ret = await RepositoryManager.init([], []);

      await expect(ret).toMatchObject([]);
    });

    it('引数のBufferをロードする', async () => {
      const dummy = createBufferTree('test', { foo: {} });
      const ret = await RepositoryManager.init([dummy], [{
        repositoryName: 'test',
        absolutePath: '/tmp/bamju-test-test'
      }]);

      await expect(ret.length).toBe(1);
      await expect(ret[0].repositoryName).toBe('test');
    });

    it('Configにある項目がRepositoryに存在しなかったら追加する', async () => {
      const test1 = createBufferTree('test1', { foo: {} });
      createBufferTree('test2', { foo: {} });
      const ret = await RepositoryManager.init([test1], [
        {
          repositoryName: 'test1',
          absolutePath: '/tmp/bamju-test-test1'
        }, {
          repositoryName: 'test2',
          absolutePath: '/tmp/bamju-test-test2'
        },
      ]);

      await expect(ret.length).toBe(2);
      await expect(ret[0].repositoryName).toBe('test1');
      await expect(ret[1].repositoryName).toBe('test2');
    });

    // TODO; 同名のリポジトリを追加したときの挙動
  });

  describe('find', () => {
    // TODO
  });

  describe('detect', () => {
    beforeEach(() => {
      const dummy = createBufferTree('test', { foo: {} });
      RepositoryManager.init([dummy], [{
        repositoryName: 'test',
        absolutePath: '/tmp/bamju-test-test'
      }]);
    });

    it('ファイルの検索ができる', () => {
      const metaData = RepositoryManager.detect('test', '/foo');

      expect(metaData).toMatchObject({
        repositoryName: 'test',
        name: 'foo',
        path: '/foo'
      });
    });

    it('repositoryが存在しない場合、nullが返る', () => {
      const metaData = RepositoryManager.detect('not found', '/hoge.md');

      expect(metaData).not.toBe(expect.anything());
    });
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
      const [metaData, result] = await RepositoryManager.addFile('test', '/hoge.md');

      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData).toMatchObject({
        name: 'hoge.md',
        path: '/hoge.md',
        repositoryName: 'test',
        absolutePath: '/tmp/bamju-test-test/hoge.md',
        itemType: ItemTypeMarkdown,
        projectPath: '/tmp/bamju-test-test',
        parent: {
          path: '/'
        }
      });
    });

    it('repositoryが存在しない場合、Failedのメッセージが返る', async () => {
      const [_, result] = await RepositoryManager.addFile('not found', '/hoge.md');

      await expect(result.type).toBe(MessageTypeFailed);
    });
  });
});

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
      let item = RepositoryManager.detect('test', '/a/b/c/d');
      expect(item).toMatchObject({
        name: 'd',
        path: '/a/b/c/d'
      });

      item = item.detect('.');
      expect(item).toMatchObject({
        name: 'd',
        path: '/a/b/c/d'
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
    it('ファイルの追加ができる', async () => {
      const rootItem = await RepositoryManager.find('test');
      const [metaData, result] = await rootItem.addFile('/hoge.md');

      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData).toMatchObject({
        name: 'hoge.md',
        path: '/hoge.md',
        repositoryName: 'test',
        absolutePath: '/tmp/bamju-test-test/hoge.md',
        itemType: ItemTypeMarkdown,
        projectPath: '/tmp/bamju-test-test',
        parent: {
          path: '/'
        }
      });
    });

    it('mkdirPが有効な場合、親のディレクトリがなくてもSucceededのメッセージが返る', async () => {
      const rootItem = await RepositoryManager.find('test');
      const [metaData, result] = await rootItem.addFile('/hoge.md');

      await expect($result);
    });

    it('mkdirPが有効でない場合、親のディレクトリがないといFailedのメッセージが返る', async () => {
      const rootItem = await RepositoryManager.find('test');
      const [metaData, result] = await rootItem.addFile('/hoge.md');

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('絶対パスでない場合、Failedのメッセージが返る', async () => {
      const rootItem = await RepositoryManager.find('test');
      const [metaData, result] = await rootItem.addFile('/hoge.md');

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('有効な拡張子の場合はSucceededが返る', async () => {
      const rootItem = await RepositoryManager.find('test');
      const [metaData, result] = await rootItem.addFile('/hoge.md');

      await expect($result);
    });

    it('無効な拡張子の場合Failedのメッセージが返る', async () => {
      const rootItem = await RepositoryManager.find('test');
      const [metaData, result] = await rootItem.addFile('/hoge.md');

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('同名のファイルが存在していた場合、Failedのメッセージが返る', async () => {
      const rootItem = await RepositoryManager.find('test');
      const [metaData, result] = await rootItem.addFile('/hoge.md');

      await expect(result.type).toBe(MessageTypeFailed);
    });
  });

  describe('parent', () => {
    // TODO
  });

  describe('rootItem', () => {
    // TODO
  });
});
