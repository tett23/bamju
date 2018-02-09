/* eslint no-undef: 0 */
// @flow

import {
  openPage,
  buffers,
} from '../../app/main/repository';
import {
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

      expect(isSimilarError(result)).not.toBe(false);

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

      expect(isSimilarError(result)).not.toBe(false);

      expect(result.test).not.toBe(5);
      expect(result.test.length).toBe(5);
      expect(result.test.find((item) => {
        return item.path === '/foo/bar/baz/testItem.md';
      })).toBeTruthy();
    });
  });
});
