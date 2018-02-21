import fs from 'fs';

import {
  openBuffer,
  buffers,
  openBySystemEditor,
  addRepository,
  removeRepository,
  createFile,
} from '../../app/main/repository';
import {
  type Message,
  isSimilarError,
} from '../../app/common/util';
import {
  RepositoryManager
} from '../../app/common/repository_manager';
import {
  Repository,
} from '../../app/common/repository';
import {
  type Buffer,
} from '../../app/common/buffer';

import '../global_config.test';
import {
  dummy,
} from '../test_utils';


let manager: RepositoryManager;
let repository: Repository;
beforeEach(() => {
  const dummyItems = dummy({
    test: [
      '/foo/bar/baz/testItem.md'
    ]
  });

  manager = new RepositoryManager(dummyItems, [{
    repositoryName: 'test',
    absolutePath: '/tmp/bamju/test'
  }]);

  const _repo = manager.find('test');
  if (_repo == null) {
    return;
  }

  repository = _repo;

  const item = repository.getItemByPath('/foo/bar/baz/testItem.md');
  if (item != null) {
    item.updateContent('hogehoge');
  }
});

describe('repository events', () => {
  describe('open-buffer', () => {
    it('ファイルの内容が取得できる', async () => {
      const result = await openBuffer({ repositoryName: 'test', itemName: 'testItem.md' });

      expect(isSimilarError(result)).toBe(false);

      expect(result[1]).toBe('<p>hogehoge</p>\n');
    });

    it('MetaDataが存在しない場合、エラーが返る', async () => {
      const result = await openBuffer({ repositoryName: 'test', itemName: 'not exist' });

      expect(isSimilarError(result)).toBe(true);
    });
  });

  describe('buffers', () => {
    it('全てのrepositoryの内容を取得できる', async () => {
      const result = await buffers();

      expect(isSimilarError(result)).toBe(false);

      expect(result).not.toBe(5);
      expect(result.length).toBe(5);
      expect(result.find((item) => {
        return item.path === '/foo/bar/baz/testItem.md';
      })).toBeTruthy();
    });
  });

  describe('open-by-system-editor', () => {
    it('ファイルを開くことができる', async () => {
      const metaData = repository.getItemByPath('/foo/bar/baz/testItem.md');
      if (metaData == null) {
        expect(true).toBe(false);
        return;
      }
      const result = await openBySystemEditor(metaData.absolutePath);

      expect(isSimilarError(result)).toBe(false);

      expect(result).toBe(true);
    });

    it('ファイルが存在しない場合、エラーが返る', async () => {
      const metaData = repository.getItemByPath('/foo/bar/baz/testItem.md');
      expect(metaData).not.toBeNull();
      if (metaData == null) {
        expect(true).toBe(false);
        return;
      }

      metaData.absolutePath = 'not exist';
      const result = await openBySystemEditor(metaData);
      expect(isSimilarError(result)).toBe(true);
    });
  });

  describe('add-repository', () => {
    it('Repositoryの追加ができる', async () => {
      fs.mkdirSync('/tmp/bamju/add-repository');
      const result = (await addRepository('/tmp/bamju/add-repository'): Repository);

      expect(isSimilarError(result)).toBe(false);

      expect(result.name).toBe('add-repository');
      const items = await buffers();
      const addRepositoryItem = items.find((item) => {
        return item.repositoryName === 'add-repository';
      });
      expect(addRepositoryItem != null).toBe(true);
    });

    it('RepositoryManagerに存在するabsolutePathの場合、エラーが返る', async () => {
      const result = await addRepository('/tmp/bamju/test');

      expect(isSimilarError(result)).toBe(true);
    });

    it('absolutePathが存在しない場合、エラーが返る', async () => {
      const result = await addRepository('/tmp/bamju/add-repository');

      expect(isSimilarError(result)).toBe(true);
    });
  });

  describe('remove-repository', () => {
    it('Repositoryの削除ができる', async () => {
      const result = (await removeRepository('/tmp/bamju/test'): Repository);

      expect(isSimilarError(result)).toBe(false);

      expect(result.name).toBe('test');

      const items = await buffers();
      expect(items.test == null).toBe(true);
    });

    it('absolutePathが存在しない場合、エラーが返る', async () => {
      const result = await removeRepository('/tmp/bamju/add-project');

      expect(isSimilarError(result)).toBe(true);
    });
  });

  describe('create-file', () => {
    it('ファイルの作成ができる', async () => {
      const result = await createFile({
        repositoryName: 'test',
        path: '/hogehoge.md'
      });
      expect(isSimilarError(result)).toBe(false);

      expect(result).toMatchObject({
        repositoryName: 'test',
        path: '/hogehoge.md'
      });
    });

    it(':つきのパスが与えられたときはrepositoryNameを上書きする', async () => {
      fs.mkdirSync('/tmp/bamju/create-file');
      await manager.addRepository({
        absolutePath: '/tmp/bamju/create-file',
        repositoryName: 'create-file'
      });

      const result = await createFile({
        repositoryName: 'test',
        path: 'create-file:/hogehoge.md'
      });
      expect(isSimilarError(result)).toBe(false);

      expect(result).toMatchObject({
        repositoryName: 'create-file',
        path: '/hogehoge.md'
      });
    });
  });
});
