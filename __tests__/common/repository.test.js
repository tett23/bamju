/* eslint no-undef: 0 */

import {
  RepositoryManager
} from '../../app/common/repository';

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
  });
});
