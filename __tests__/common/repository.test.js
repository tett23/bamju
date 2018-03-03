/* eslint no-undef: 0 */

import fs from 'fs';
import path from '../../app/common/path';

import {
  RepositoryManager,
} from '../../app/common/repository_manager';
import {
  Repository,
} from '../../app/common/repository';
import {
  ItemTypeMarkdown,
  ItemTypeDirectory,
} from '../../app/common/metadata';
import {
  MessageTypeSucceeded,
  MessageTypeFailed,
  MessageTypeError,
} from '../../app/common/message';

import {
  dummy,
} from '../test_utils';

let manager: RepositoryManager;
let repository: Repository;
beforeEach(() => {
  const buffers = dummy({
    test: [
      '/foo/bar/baz/testItem.md'
    ]
  });

  manager = new RepositoryManager(buffers, [{
    repositoryName: 'test',
    absolutePath: '/tmp/bamju/test'
  }]);

  repository = manager.find('test');
});

describe('Repository', () => {
  describe('constructor', () => {
    it('absolutePathが実際に存在しない場合Failedのメッセージが返る', () => {
      const testFunc = () => {
        return new Repository({
          repositoryName: 'foo',
          absolutePath: '/tmp/bamju/foo'
        });
      };

      expect(testFunc).toThrowError();
    });
  });

  describe('load', () => {
    it('ファイルの差分をロードできる', async () => {
      const rootItem = repository.rootItem();
      fs.mkdirSync(path.join(rootItem.absolutePath, 'diff'));
      fs.unlinkSync(path.join(rootItem.absolutePath, 'foo/bar/baz/testItem.md'));

      const [newState, message] = await repository.load();
      expect(message.type).toBe(MessageTypeSucceeded);

      const diffItem = newState.getItemByPath('/diff');
      expect(diffItem).toMatchObject({
        name: 'diff',
        path: path.join(rootItem.path, 'diff'),
        parentID: rootItem.id
      });

      const del = newState.getItemByPath('/foo/bar/baz/testItem.md');
      expect(del).not.toBe(expect.anything());
    });

    it('rootItemが消えていた場合、MessageTypeErrorが返る', async () => {
      const rootItem = repository.rootItem();
      fs.unlinkSync(path.join(rootItem.absolutePath, 'foo/bar/baz/testItem.md'));
      fs.rmdirSync(path.join(rootItem.absolutePath, 'foo/bar/baz'));
      fs.rmdirSync(path.join(rootItem.absolutePath, 'foo/bar'));
      fs.rmdirSync(path.join(rootItem.absolutePath, 'foo'));
      fs.rmdirSync(rootItem.absolutePath);

      const [_, message] = await repository.load();
      expect(message.type).toBe(MessageTypeError);
    });

    it('rootItemがディレクトリでない場合、MessageTypeFailedが返る', async () => {
      const rootItem = repository.rootItem();
      fs.unlinkSync(path.join(rootItem.absolutePath, 'foo/bar/baz/testItem.md'));
      fs.rmdirSync(path.join(rootItem.absolutePath, 'foo/bar/baz'));
      fs.rmdirSync(path.join(rootItem.absolutePath, 'foo/bar'));
      fs.rmdirSync(path.join(rootItem.absolutePath, 'foo'));
      fs.rmdirSync(rootItem.absolutePath);
      fs.writeFileSync('/tmp/bamju/test', '');

      const [_, message] = await repository.load();
      expect(message.type).toBe(MessageTypeFailed);
    });
  });

  describe('addFile', () => {
    it('ファイルの追加ができる', async () => {
      const [metaData, result] = await repository.addFile('/hoge.md');

      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData).toMatchObject({
        name: 'hoge.md',
        path: '/hoge.md',
        repositoryName: 'test',
        absolutePath: '/tmp/bamju/test/hoge.md',
        itemType: ItemTypeMarkdown,
        repositoryPath: '/tmp/bamju/test',
      });
    });

    it('親のディレクトリがなくてもSucceededのメッセージが返る', async () => {
      const [metaData, result] = await repository.addFile('/foo/bar/baz.md');

      await expect(result.type).toBe(MessageTypeSucceeded);
      expect(metaData).toMatchObject({
        path: '/foo/bar/baz.md',
      });
    });

    // TODO: 親が存在しないとき、親も作成される

    it('絶対パスでない場合、Failedのメッセージが返る', async () => {
      const [_, result] = await repository.addFile('hoge.md');

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('.を含むパスを解釈できる', async () => {
      const [metaData, result] = await repository.addFile('/foo/./baz.md');

      await expect(result.type).toBe(MessageTypeSucceeded);

      expect(metaData).toMatchObject({
        path: '/foo/baz.md',
      });
    });

    it('..を含むパスを解釈できる', async () => {
      const [metaData, result] = await repository.addFile('/foo/bar/../baz.md');

      await expect(result.type).toBe(MessageTypeSucceeded);

      expect(metaData).toMatchObject({
        path: '/foo/baz.md',
      });
    });

    it('contentの内容でファイルが作成される', async () => {
      const [metaData, _] = await repository.addFile('/foo/bar/../baz.md', 'hogehoge');

      const content = fs.readFileSync(metaData.absolutePath, 'utf8');

      expect(content).toBe('hogehoge');
    });
  });

  describe('addDirectory', () => {
    it('ディレクトリの作成ができる', async () => {
      const [metaData, result] = await repository.addDirectory('/hoge');

      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData).toMatchObject({
        name: 'hoge',
        path: '/hoge',
        repositoryName: 'test',
        absolutePath: '/tmp/bamju/test/hoge',
        itemType: ItemTypeDirectory,
        repositoryPath: '/tmp/bamju/test',
      });
    });

    it('ディレクトリは再帰的に作成される', async () => {
      const [metaData, result] = await repository.addDirectory('/foo/bar/baz');

      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData).toMatchObject({
        name: 'baz',
        path: '/foo/bar/baz',
        repositoryName: 'test',
        absolutePath: '/tmp/bamju/test/foo/bar/baz',
        itemType: ItemTypeDirectory,
      });
    });

    it('ファイル名に.を含む場合Failedのメッセージが返る', async () => {
      const [_, result] = await repository.addDirectory('/foo/bar/baz.a');

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('同名のディレクトリを作っても中身が消えたりしない（別のオブジェクトに差し替えられたりしない）', async () => {
      let [dir, result] = await repository.addDirectory('/hoge');
      await expect(result.type).toBe(MessageTypeSucceeded);

      const { id } = dir;

      [dir, result] = await repository.addDirectory('/hoge');
      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(dir.id).toBe(id);
    });

    it('絶対パスでない場合、Failedのメッセージが返る', async () => {
      const [_, result] = await repository.addDirectory('hoge');

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('.を含むパスを解釈できる', async () => {
      const [metaData, result] = await repository.addDirectory('/foo/./baz');

      await expect(result.type).toBe(MessageTypeSucceeded);

      expect(metaData).toMatchObject({
        path: '/foo/baz',
      });
    });

    it('..を含むパスを解釈できる', async () => {
      const [metaData, result] = await repository.addDirectory('/foo/bar/../baz');

      await expect(result.type).toBe(MessageTypeSucceeded);

      expect(metaData).toMatchObject({
        path: '/foo/baz',
      });
    });
  });

  describe('watch', () => {
    let metaData;
    let watchRepository;
    beforeEach(async () => {
      let _;
      [metaData, _] = await repository.addFile('/watch.md'); // eslint-disable-line prefer-const
      fs.mkdirSync('/tmp/bamju/watch_test');
      [watchRepository, _] = manager.addRepository({
        repositoryName: 'watch_test',
        absolutePath: '/tmp/bamju/watch_test'
      }, []);
    });

    it('repositoryに追加される', async () => {
      await watchRepository.watch(metaData);
      expect(watchRepository.getItemByID(metaData.id)).not.toBe(null);
    });

    it('parentが存在しない場合、作成される', async () => {
      metaData.path = '/foo/bar/baz/deepItem.md';
      await watchRepository.watch(metaData);

      expect(fs.existsSync(path.join(watchRepository.absolutePath, '/foo/bar/baz'))).toBe(true);
      expect(watchRepository.getItemByPath('/foo')).not.toBe(null);
      expect(watchRepository.getItemByPath('/foo/bar')).not.toBe(null);
      expect(watchRepository.getItemByPath('/foo/bar/baz')).not.toBe(null);
      expect(watchRepository.getItemByPath('/foo/bar/baz/deepItem.md')).not.toBe(null);
    });

    it('parentIDが設定される', async () => {
      await watchRepository.watch(metaData);
      expect(metaData.parentID).toBe(watchRepository.rootItem().id);
    });

    it('repositoryName, repositoryPathが設定される', async () => {
      await watchRepository.watch(metaData);
      expect(metaData.repositoryPath).toBe(watchRepository.absolutePath);
      expect(metaData.repositoryName).toBe(watchRepository.name);
    });

    it('parentのchildrenIDsに追加される', async () => {
      expect(watchRepository.rootItem().childrenIDs).not.toContain(metaData.id);
      await watchRepository.watch(metaData);
      expect(watchRepository.rootItem().childrenIDs).toContain(metaData.id);
    });
  });

  describe('unwatch', () => {
    let metaData;
    beforeEach(async () => {
      let _;
      [metaData, _] = await repository.addFile('/unwatch.md'); // eslint-disable-line prefer-const
    });

    it('repositoryから削除される', async () => {
      expect(repository.getItemByID(metaData.id)).not.toBe(null);
      await repository.unwatch(metaData);
      expect(repository.getItemByID(metaData.id)).toBe(null);
    });

    it('parentIDがnullになる', async () => {
      expect(repository.getItemByID(metaData.id).parentID).toBe(repository.rootItem().id);
      await repository.unwatch(metaData);
      expect(metaData.parentID).toBe(null);
    });

    it('parentのアイテムから削除される', async () => {
      expect(repository.rootItem().childrenIDs).toContain(metaData.id);
      await repository.unwatch(metaData);
      expect(repository.rootItem().childrenIDs).not.toContain(metaData.id);
    });
  });

  describe('find', () => {
    it('ファイルの検索ができる', () => {
      expect(repository.find('/foo/bar/baz/testItem.md')).toMatchObject({
        path: '/foo/bar/baz/testItem.md'
      });
    });

    it('repositoryが存在しない場合はnullを返す', () => {
      expect(repository.find('hoge')).not.toBe(expect.anything());
    });
  });

  describe('isExist', () => {
    it('repositoryが存在する場合はtrueを返す', () => {
      expect(manager.isExist('test')).toBe(true);
    });

    it('repositoryが存在しない場合はfalseを返す', () => {
      expect(manager.isExist('hgoe')).toBe(false);
    });
  });

  describe('rootItem', () => {
    it('ルートのアイテムが取得できる', () => {
      const item = repository.rootItem();
      expect(item.path).toBe('/');
    });
  });

  describe('toBuffers', () => {
    it('Bufferの取得ができる', () => {
      const repo = new Repository([{
        id: '',
        name: '/',
        path: '/',
        repositoryName: 'test',
        repositoryPath: '/tmp/test',
        absolutePath: '/tmp/test',
        itemType: ItemTypeDirectory,
        isLoaded: false,
        childrenIDs: [],
        parentID: null,
      }], {
        repositoryName: 'test',
        absolutePath: '/tmp/bamju/test'
      });
      const buffers = repo.toBuffers();

      expect(buffers.length).toBe(1);
      expect(buffers[0].path).toBe('/');
    });
  });

  describe('toConfig', () => {
    it('RepositoryConfigの取得ができる', () => {
      expect(repository.toConfig()).toMatchObject({
        repositoryName: 'test',
        absolutePath: '/tmp/bamju/test'
      });
    });
  });

  describe('detect', () => {
    beforeEach(() => {
      const buffers = dummy({
        test: [
          'index',
          'a/b/c/d/e/deepItem.md',
          'foo/bar/baz/test1',
          'relative path test/test1',
          'synonymTest/foo/synonym',
          'synonymTest/bar/synonym',
          'detect self',
          'rootItem',
          'aaa.md',
          'aa.md',
          'partial match test',
          '濁点つきのファイル名ガ'
        ],
        test2: []
      });

      manager = new RepositoryManager(buffers, [{
        repositoryName: 'test',
        absolutePath: '/tmp/bamju/test'
      }], {
        repositoryName: 'test2',
        absolutePath: '/tmp/bamju/test2'
      });

      repository = manager.find('test');
    });

    it('該当するアイテムを返す', () => {
      const item = repository.detect('index');
      expect(item).toMatchObject({
        name: 'index',
        path: '/index'
      });
    });

    it('該当するアイテムがないときはnullを返す', () => {
      expect(repository.detect('該当しないファイル名')).not.toBe(expect.anything());
    });

    it('..を含むパスを渡したときはそれを解釈して該当するアイテムを返す', () => {
      const item = repository.detect('/a/b/c/..');
      expect(item).toMatchObject({
        name: 'b',
        path: '/a/b'
      });
    });

    it('/はルートのアイテムを取得する', () => {
      let rootItem = repository.detect('/');
      expect(rootItem).toMatchObject({
        name: 'test',
        path: '/'
      });

      const item = rootItem.detect('deepItem');
      rootItem = item.detect('/');
      expect(rootItem).toMatchObject({
        name: 'test',
        path: '/'
      });

      rootItem = repository.detect('/');
      rootItem = rootItem.detect('..');
      expect(rootItem).toMatchObject({
        name: 'test',
        path: '/'
      });
    });

    it('/はcurrentが何であるとルートのアイテムを取得する', () => {
      let rootItem = repository.detect('/');
      expect(rootItem).toMatchObject({
        name: 'test',
        path: '/'
      });

      const item = rootItem.detect('deepItem');
      rootItem = item.detect('/');
      expect(rootItem).toMatchObject({
        name: 'test',
        path: '/'
      });

      rootItem = repository.detect('/');
      rootItem = rootItem.detect('..');
      expect(rootItem).toMatchObject({
        name: 'test',
        path: '/'
      });
    });

    it('.は現在のアイテムを取得する', () => {
      let item = repository.detect('detect self');
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
      let rootItem = repository.detect('/');
      expect(rootItem).toMatchObject({
        name: 'test',
        path: '/'
      });

      rootItem = rootItem.detect('.');
      expect(rootItem).toMatchObject({
        name: 'test',
        path: '/'
      });
    });

    it('/../するとルートの取得ができる', () => {
      const rootItem = repository.detect('/../');
      expect(rootItem).toMatchObject({
        name: 'test',
        path: '/'
      });
    });

    it('/で始まるものはルートから検索される', () => {
      const item = repository.detect('/foo/bar');
      expect(item).toMatchObject({
        name: 'bar',
        path: '/foo/bar'
      });
    });

    it('単体の文字列での検索は全てを検索する', () => {
      const item = repository.detect('deepItem');
      expect(item).toMatchObject({
        name: 'deepItem.md',
        path: '/a/b/c/d/e/deepItem.md'
      });
    });

    it('相対パスのときは現在のアイテムから検索する', () => {
      let item = repository.detect('/foo/bar');
      expect(item).toMatchObject({
        name: 'bar',
        path: '/foo/bar'
      });

      item = item.detect('./baz/test1');
      expect(item).toMatchObject({
        name: 'test1',
        path: '/foo/bar/baz/test1'
      });

      item = item.parent();
      item = item.detect('./baz/test1');
      expect(item).toMatchObject({
        name: 'test1',
        path: '/foo/bar/baz/test1'
      });
    });

    it('/は含むが.で始まらないものはルートからの部分一致で検索する', () => {
      let item = repository.detect('/');

      item = item.detect('baz/test1');
      expect(item).toMatchObject({
        name: 'test1',
        path: '/foo/bar/baz/test1'
      });

      item = repository.detect('e/deepItem');
      expect(item).toMatchObject({
        name: 'deepItem.md',
        path: '/a/b/c/d/e/deepItem.md'
      });

      item = repository.detect('a/deepItem');
      expect(item).not.toBe(expect.anything());
    });

    it('.で始まるときは現在のアイテムから検索する', () => {
      const item = repository.detect('/synonymTest');
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

    it('aaa.mdがあるとき、aa.mdにマッチしたりはしない', () => {
      const item = repository.detect('aa');

      expect(item).toMatchObject({
        name: 'aa.md',
        path: '/aa.md'
      });
    });

    it('nameの部分が部分一致したりはしない', () => {
      const item = repository.detect('partial match');

      expect(item).not.toBe(expect.anything());
    });

    // TODO: .txt, .mdのディレクトリを自動で開く

    // TODO
    // it('濁点とかを含んでいても検索できる(mac-utf8)', () => {
    //   expect(RepositoryManager.detect('test', '該当しないファイル名ガ')).toBeTruthy();
    // });
  });
});
