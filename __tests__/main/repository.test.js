/* eslint no-undef: 0 */
// @flow

// import {
//   ipcMain,
//   BrowserWindow
// } from 'electron';
// import electron from 'electron-prebuilt';

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

import '../global_config.test';
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
      console.log(result);

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
      const result = await buffers();

      expect(isSimilarError(result)).not.toBe(false);

      expect(result.test.length).toBe(5);
      expect(result.test.find(() => {
        '/foo/bar/baz/testItem.md';
      })).toBeFalsy();
    });
  });
});
