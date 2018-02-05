/* eslint no-undef: 0 */

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

  describe('detect', () => {
    // TODO
  });
});
