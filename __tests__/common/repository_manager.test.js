/* eslint no-undef: 0 */

import fs from 'fs';

import {
  RepositoryManager,
} from '../../app/common/repository_manager';
import {
  ItemTypeDirectory,
} from '../../app/common/metadata';
import {
  MessageTypeFailed,
  MessageTypeError,
} from '../../app/common/message';

import '../global_config.test';
import {
  dummy,
} from '../test_utils';

let manager: RepositoryManager;
beforeEach(() => {
  const dummyBuffers = dummy({
    test: ['/foo']
  });

  manager = new RepositoryManager(dummyBuffers, [{
    repositoryName: 'test',
    absolutePath: '/tmp/bamju/test'
  }]);
});


describe('RepositoryManager', () => {
  describe('constructor', () => {
    it('引数が空なら値も空になる', () => {
      manager = new RepositoryManager([], []);

      expect(manager.getRepositories()).toMatchObject([]);
    });

    it('引数のBufferをロードする', () => {
      fs.mkdirSync('/tmp/bamju/test-test');
      manager = new RepositoryManager([], [{
        repositoryName: 'hoge',
        absolutePath: '/tmp/bamju/test-test'
      }]);
      const repositories = manager.getRepositories();

      expect(repositories.length).toBe(1);
      expect(repositories[0].name).toBe('hoge');
    });

    it('Configにある項目がRepositoryに存在しなかったら追加する', () => {
      fs.mkdirSync('/tmp/bamju/test-test1');
      fs.mkdirSync('/tmp/bamju/test-test2');
      manager = new RepositoryManager([], [
        {
          repositoryName: 'test1',
          absolutePath: '/tmp/bamju/test-test1'
        }, {
          repositoryName: 'test2',
          absolutePath: '/tmp/bamju/test-test2'
        },
      ]);

      const repositories = manager.getRepositories();

      expect(repositories.length).toBe(2);
      expect(manager.find('test1').name).toBe('test1');
      expect(manager.find('test2').name).toBe('test2');
    });

    it('同名のrepositoryが追加されるとFailedのメッセージが返る', () => {
      fs.mkdirSync('/tmp/bamju/foo');
      const testFunc = () => {
        return new RepositoryManager([], [
          {
            repositoryName: 'foo',
            absolutePath: '/tmp/bamju/foo'
          }, {
            repositoryName: 'foo',
            absolutePath: '/tmp/bamju/foo'
          },
        ]);
      };

      expect(testFunc).toThrowError();
    });

    it('absolutePathが同じrepositoryが追加されるとFailedのメッセージが返る', () => {
      const testFunc = () => {
        return new RepositoryManager([], [
          {
            repositoryName: 'foo',
            absolutePath: '/tmp/bamju/foo'
          }, {
            repositoryName: 'foo',
            absolutePath: '/tmp/bamju/foo'
          },
        ]);
      };

      expect(testFunc).toThrowError();
    });
  });

  describe('find', () => {
    it('repositoryを取得できる', () => {
      expect(manager.find('test').name).toBe('test');
    });

    it('repositoryが存在しない場合はnullを返す', () => {
      expect(manager.find('hoge')).not.toBe(expect.anything());
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
  describe('getItemByID', () => {
    it('MetaDataを取得できる', () => {
      const metaData = manager.find('test').getItemByPath('/foo');
      expect(manager.getItemByID(metaData.id).id).toBe(metaData.id);
    });

    it('MetaDataが存在しない場合はnullを返す', () => {
      expect(manager.getItemByID('hogehoge')).not.toBe(expect.anything);
    });
  });

  describe('detect', () => {
    it('ファイルの検索ができる', () => {
      const metaData = manager.detect('test', '/foo');

      expect(metaData).toMatchObject({
        repositoryName: 'test',
        name: 'foo',
        path: '/foo'
      });
    });

    it('repositoryが存在しない場合、nullが返る', () => {
      const metaData = manager.detect('not found', '/bar');

      expect(metaData).not.toBe(expect.anything());
    });

    it('internalPathでrepositoryNameが指定された場合、引数を上書きする', () => {
      const metaData = manager.detect('test', 'not found:/bar');

      expect(metaData).not.toBe(expect.anything());
    });
  });

  describe('addRepository', () => {
    it('porositoryの追加ができる', () => {
      fs.mkdirSync('/tmp/bamju/foo');
      manager.addRepository({
        repositoryName: 'foo',
        absolutePath: '/tmp/bamju/foo'
      });

      expect(manager.find('foo').name).toBe('foo');
    });

    it('同名のrepositoryが追加されるとFailedのメッセージが返る', () => {
      fs.mkdirSync('/tmp/bamju/foo');
      manager.addRepository({
        repositoryName: 'foo',
        absolutePath: '/tmp/bamju/foo'
      });

      const [_, result] = manager.addRepository({
        repositoryName: 'foo',
        absolutePath: '/tmp/bamju/foo'
      });

      expect(result.type).toBe(MessageTypeFailed);
    });

    it('absolutePathが同じrepositoryが追加されるとFailedのメッセージが返る', () => {
      fs.mkdirSync('/tmp/bamju/foo');
      manager.addRepository({
        repositoryName: 'foo',
        absolutePath: '/tmp/bamju/foo'
      });

      const [_, result] = manager.addRepository({
        repositoryName: 'bar',
        absolutePath: '/tmp/bamju/foo'
      });

      expect(result.type).toBe(MessageTypeFailed);
    });

    it('absolutePathが実際に存在しない場合Errorのメッセージが返る', () => {
      const [_, message] = manager.addRepository({
        repositoryName: 'foo',
        absolutePath: '/tmp/bamju/foo'
      });

      expect(message.type).toBe(MessageTypeError);
    });
  });

  describe('addRepository', () => {
    it('Repositoryの削除ができる', () => {
      expect(manager.removeRepository('test')).toMatchObject({
        name: 'test'
      });
    });

    it('repositoryNameが存在しない場合、nullが返る', () => {
      expect(manager.removeRepository('test')).not.toBe(expect.anything());
    });
  });

  describe('toBuffer', () => {
    it('Bufferの取得ができる', () => {
      manager = new RepositoryManager([{
        id: '',
        name: '/',
        path: '/',
        repositoryName: 'test',
        repositoryPath: '/tmp/test',
        absolutePath: '/tmp/test',
        itemType: ItemTypeDirectory,
        isLoaded: false,
        isOpened: false,
        childrenIDs: [],
        parentID: null,
      }], [{
        repositoryName: 'test',
        absolutePath: '/tmp/bamju/test'
      }]);
      const buffers = manager.toBuffers();

      expect(buffers[0].path).toBe('/');
    });
  });
});
