/* eslint no-undef: 0 */
// @flow

import {
  RepositoryManager,
} from '../../app/common/repository';
import {
  ItemTypeMarkdown,
} from '../../app/common/metadata';
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
    beforeEach(() => {
      const dummy = createBufferTree('test', { foo: {} });
      RepositoryManager.init([dummy], [{
        repositoryName: 'test',
        absolutePath: '/tmp/bamju-test-test'
      }]);
    });

    it('ファイルの検索ができる', () => {
      expect(RepositoryManager.find('test')).toMatchObject({
        repositoryName: 'test',
        path: '/'
      });
    });

    it('repositoryが存在しない場合はnullを返す', () => {
      expect(RepositoryManager.find('hoge')).not.toBe(expect.anything());
    });
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

  describe('isExist', () => {
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
        repositoryPath: '/tmp/bamju-test-test',
      });
    });

    it('同名のファイルを作ろうとするとFailedのメッセージが返る', async () => {
      let [_, result] = await RepositoryManager.addFile('test', '/hoge.md');
      await expect(result.type).toBe(MessageTypeSucceeded);

      [_, result] = await RepositoryManager.addFile('not found', '/hoge.md');
      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('repositoryが存在しない場合、Failedのメッセージが返る', async () => {
      const [_, result] = await RepositoryManager.addFile('not found', '/hoge.md');

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('recursiveが有効な場合、親のディレクトリがなくてもSucceededのメッセージが返る', async () => {
      const [metaData, result] = await RepositoryManager.addFile('test', '/foo/bar/baz.md', { recursive: true });

      await expect(result.type).toBe(MessageTypeSucceeded);
      expect(metaData).toMatchObject({
        path: '/foo/bar/baz.md',
      });
    });

    it('recursiveが有効な場合、同名のディレクトリ作成してもエラーにならない', async () => {
      let [_, result] = await RepositoryManager.addFile('test', '/foo/bar/baz.md', { recursive: true });
      await expect(result.type).toBe(MessageTypeSucceeded);

      [_, result] = await RepositoryManager.addFile('test', '/foo/bar/aaa.md', { recursive: true });
      await expect(result.type).toBe(MessageTypeSucceeded);
    });

    it('recursiveが有効でない場合、親のディレクトリがないといFailedのメッセージが返る', async () => {
      const [_, result] = await RepositoryManager.addFile('test', '/foo/bar/baz.md', { recursive: false });

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('絶対パスでない場合、Failedのメッセージが返る', async () => {
      const [_, result] = await RepositoryManager.addFile('test', 'hoge.md');

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('.を含むパスを解釈できる', async () => {
      const [metaData, result] = await RepositoryManager.addFile('test', '/foo/./baz.md', { recursive: true });

      await expect(result.type).toBe(MessageTypeSucceeded);

      expect(metaData).toMatchObject({
        path: '/foo/baz.md',
      });
    });

    it('..を含むパスを解釈できる', async () => {
      const [metaData, result] = await RepositoryManager.addFile('test', '/foo/bar/../baz.md', { recursive: true });

      await expect(result.type).toBe(MessageTypeSucceeded);

      expect(metaData).toMatchObject({
        path: '/foo/baz.md',
      });
    });
  });

  describe('addDirectory', () => {
    // TODO
  });
});
