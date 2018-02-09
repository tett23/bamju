// @flow

import fs from 'fs';

import {
  openPage,
  buffers,
  openBySystemEditor,
  addProject,
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
  describe('open-page', () => {
    it('ファイルの内容が取得できる', async () => {
      const result = await openPage({ repositoryName: 'test', itemName: 'testItem.md' });

      expect(isSimilarError(result)).toBe(false);

      expect(result[1]).toBe('hogehoge');
    });

    it('MetaDataが存在しない場合、エラーが返る', async () => {
      const result = await openPage({ repositoryName: 'test', itemName: 'not exist' });

      expect(isSimilarError(result)).toBe(true);
    });
  });

  describe('buffers', () => {
    it('全てのrepositoryの内容を取得できる', async () => {
      const result = ((await buffers()): { [string]: Buffer[] });

      expect(isSimilarError(result)).toBe(false);

      expect(result.test).not.toBe(5);
      expect(result.test.length).toBe(5);
      expect(result.test.find((item) => {
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
      const result = await openBySystemEditor(metaData);

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

  describe('add-project', () => {
    it('Repositoryの追加ができる', async () => {
      fs.mkdirSync('/tmp/bamju/add-project');
      const result = (await addProject('/tmp/bamju/add-project'): {[string]: Buffer[]});

      expect(isSimilarError(result)).toBe(false);

      expect(result['add-project']).toBe(true);
    });

    it('RepositoryManagerに存在するabsolutePathの場合、エラーが返る', async () => {
      const result = await addProject('/tmp/bamju/test');

      expect(isSimilarError(result)).toBe(true);
    });

    it('absolutePathが存在しない場合、エラーが返る', async () => {
      const result = await addProject('/tmp/bamju/add-project');

      expect(isSimilarError(result)).toBe(true);
    });
  });
});
