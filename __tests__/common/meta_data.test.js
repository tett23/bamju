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
  MetaData,
  ItemTypeMarkdown,
  ItemTypeText,
  ItemTypeCSV,
  ItemTypeTSV,
  ItemTypeHTML,
  ItemTypeRepository,
  ItemTypeDirectory,
  ItemTypeUndefined
} from '../../app/common/metadata';
import {
  MessageTypeFailed,
  MessageTypeError,
  MessageTypeSucceeded
} from '../../app/common/util';

import '../global_config.test';

import {
  dummy,
} from '../test_utils';


let manager:RepositoryManager;
let repository:Repository;
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

describe('MetaData', () => {
  describe('addFile', () => {
    let rootItem:MetaData;
    beforeEach(() => {
      rootItem = repository.rootItem();
    });

    it('ファイルの追加ができる', async () => {
      const [metaData, result] = await rootItem.addFile('hoge.md');

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

    it('addFileされたとき、実際にファイルが作られる', async () => {
      const [metaData, _] = await rootItem.addFile('hoge.md');

      await expect(() => {
        fs.statSync(metaData.absolutePath);
      }).not.toThrowError();
    });

    it('有効な拡張子の場合はSucceededが返る', async () => {
      const [_, result] = await rootItem.addFile('hoge.md');

      await expect(result.type).toBe(MessageTypeSucceeded);
    });

    it('無効な拡張子の場合Failedのメッセージが返る', async () => {
      const [_, result] = await rootItem.addFile('foo.bar');

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('ItemTypeの判定をしてファイルの作成ができる', async () => {
      let [metaData, result] = await rootItem.addFile('hoge.md');
      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData.itemType).toBe(ItemTypeMarkdown);

      [metaData, result] = await rootItem.addFile('hoge.txt');
      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData.itemType).toBe(ItemTypeText);

      [metaData, result] = await rootItem.addFile('hoge.csv');
      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData.itemType).toBe(ItemTypeCSV);

      [metaData, result] = await rootItem.addFile('hoge.tsv');
      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData.itemType).toBe(ItemTypeTSV);

      [metaData, result] = await rootItem.addFile('hoge.html');
      await expect(result.type).toBe(MessageTypeSucceeded);
      await expect(metaData.itemType).toBe(ItemTypeHTML);
    });

    it('同名のファイルが存在していた場合、Failedのメッセージが返る', async () => {
      let [_, result] = await rootItem.addFile('synonym.md');

      await expect(result.type).toBe(MessageTypeSucceeded);

      [_, result] = await rootItem.addFile('synonym.md');

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('path.sepを含むファイルを作ろうとするとFailedのメッセージが返る', async () => {
      const testFileName = ['/foo/bar', 'a/b'];
      for (let i = 0; i < testFileName.length; i += 1) {
        const [_, result] = await rootItem.addFile(testFileName[i]);
        await expect(result.type).toBe(MessageTypeFailed);
      }
    });
  });

  describe('addDirectory', () => {
    let rootItem:MetaData;
    beforeEach(() => {
      rootItem = repository.rootItem();
    });

    it('ディレクトリの追加ができる', async () => {
      const [metaData, result] = await rootItem.addDirectory('hoge');

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

    it('addDirectoryされたとき、実際にディレクトリが作られる', async () => {
      const [metaData, _] = await rootItem.addDirectory('hoge');

      await expect(() => {
        fs.statSync(metaData.absolutePath);
      }).not.toThrowError();
    });

    it('.つきのディレクトリは作成できない', async () => {
      const [_, result] = await rootItem.addDirectory('foo.bar');

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('同名のディレクトリが存在していた場合、Failedのメッセージが返る', async () => {
      let [_, result] = await rootItem.addDirectory('synonym');

      await expect(result.type).toBe(MessageTypeSucceeded);

      [_, result] = await rootItem.addDirectory('synonym');

      await expect(result.type).toBe(MessageTypeFailed);
    });

    it('path.sepを含むディレクトリを作ろうとするとFailedのメッセージが返る', async () => {
      const testFileName = ['/foo/bar', 'a/b'];
      for (let i = 0; i < testFileName.length; i += 1) {
        const [_, result] = await rootItem.addDirectory(testFileName[i]);
        await expect(result.type).toBe(MessageTypeFailed);
      }
    });

    it('isSimilarDirectoryでないMetaDataにaddDirectoryはできない', async () => {
      const [fileMetaData, _] = await rootItem.addFile('foo.md');
      const [__, result] = await fileMetaData.addDirectory('bar');

      await expect(result.type).toBe(MessageTypeFailed);
    });
  });

  describe('parent', () => {
    it('親のアイテムを取得できる', () => {
      const item = repository.getItemByPath('/foo/bar').parent();
      expect(item.path).toBe('/foo');
    });

    it('this.path === "/"のときはnullを返す', () => {
      const rootItem = repository.getItemByPath('/');
      expect(rootItem.parent()).not.toBe(expect.anything());
    });
  });

  describe('children', () => {
    // TODO
  });

  describe('childItem', () => {
    it('子のアイテムを取得できる', () => {
      const item = repository.getItemByPath('/foo');

      expect(item.childItem('bar').path).toBe('/foo/bar');
    });

    it('ファイルがない場合はnullを返す', () => {
      const item = repository.getItemByPath('/');

      expect(item.childItem('hogehoge')).not.toBe(expect.anything());
    });

    it('直下にない場合はnullを返す', () => {
      const item = repository.getItemByPath('/');

      expect(item.childItem('bar')).not.toBe(expect.anything());
    });
  });

  describe('isExist', () => {
    it('アイテムがある場合はtrueを返す', () => {
      const item = repository.getItemByPath('/');

      expect(item.isExist('foo')).toBe(true);
    });

    it('ファイルがない場合はnullを返す', () => {
      const item = repository.getItemByPath('/');

      expect(item.isExist('hogehoge')).toBe(false);
    });

    it('直下にない場合はnullを返す', () => {
      const item = repository.getItemByPath('/');

      expect(item.isExist('bar')).toBe(false);
    });
  });

  const allTypes = [ItemTypeMarkdown, ItemTypeText, ItemTypeCSV, ItemTypeTSV, ItemTypeHTML, ItemTypeRepository, ItemTypeDirectory, ItemTypeUndefined];

  it('isSimilarFile', () => {
    const metaData = new MetaData({
      id: '',
      name: '/',
      path: '/',
      repositoryName: 'test',
      repositoryPath: '/tmp/test',
      absolutePath: '/tmp/test',
      itemType: ItemTypeRepository,
      isLoaded: false,
      isOpened: false,
      childrenIDs: [],
      parentID: null,
    });

    allTypes.forEach((itemType) => {
      metaData.itemType = itemType;

      switch (itemType) {
      case ItemTypeMarkdown:
        return expect(metaData.isSimilarFile()).toBe(true);
      case ItemTypeText:
        return expect(metaData.isSimilarFile()).toBe(true);
      case ItemTypeCSV:
        return expect(metaData.isSimilarFile()).toBe(true);
      case ItemTypeTSV:
        return expect(metaData.isSimilarFile()).toBe(true);
      case ItemTypeHTML:
        return expect(metaData.isSimilarFile()).toBe(true);
      case ItemTypeRepository:
        return expect(metaData.isSimilarFile()).toBe(false);
      case ItemTypeDirectory:
        return expect(metaData.isSimilarFile()).toBe(false);
      case ItemTypeUndefined:
        return expect(metaData.isSimilarFile()).toBe(false);
      default:
        return expect(true).toBe(false);
      }
    });
  });

  it('isSimilarDirectory', () => {
    const metaData = new MetaData({
      id: '',
      name: '/',
      path: '/',
      repositoryName: 'test',
      repositoryPath: '/tmp/test',
      absolutePath: '/tmp/test',
      itemType: ItemTypeRepository,
      isLoaded: false,
      isOpened: false,
      childrenIDs: [],
      parentID: null,
    });

    allTypes.forEach((itemType) => {
      metaData.itemType = itemType;


      switch (itemType) {
      case ItemTypeMarkdown:
        return expect(metaData.isSimilarDirectory()).toBe(false);
      case ItemTypeText:
        return expect(metaData.isSimilarDirectory()).toBe(false);
      case ItemTypeCSV:
        return expect(metaData.isSimilarDirectory()).toBe(false);
      case ItemTypeTSV:
        return expect(metaData.isSimilarDirectory()).toBe(false);
      case ItemTypeHTML:
        return expect(metaData.isSimilarDirectory()).toBe(false);
      case ItemTypeRepository:
        return expect(metaData.isSimilarDirectory()).toBe(true);
      case ItemTypeDirectory:
        return expect(metaData.isSimilarDirectory()).toBe(true);
      case ItemTypeUndefined:
        return expect(metaData.isSimilarDirectory()).toBe(false);
      default:
        return expect(true).toBe(false);
      }
    });
  });

  describe('toBuffer', () => {
    it('入力と同じBufferが得られる', () => {
      const buffer = {
        id: '',
        name: '/',
        path: '/',
        repositoryName: 'test',
        repositoryPath: '/tmp/test',
        absolutePath: '/tmp/test',
        itemType: ItemTypeRepository,
        isLoaded: false,
        isOpened: false,
        childrenIDs: [],
        parentID: null,
      };
      const metaData = new MetaData(buffer);
      buffer.id = metaData.id;

      expect(metaData.toBuffer()).toMatchObject(buffer);
    });

    it('値が変更された場合、変更された値が得られる', () => {
      const buffer = {
        id: '',
        name: '/',
        path: '/',
        repositoryName: 'test',
        repositoryPath: '/tmp/test',
        absolutePath: '/tmp/test',
        itemType: ItemTypeRepository,
        isLoaded: false,
        isOpened: false,
        children: [],
        parent: null,
      };
      const metaData = new MetaData(buffer);

      metaData.name = 'foo';

      expect(metaData.toBuffer().name).toBe('foo');
    });
  });

  describe('updateContent', () => {
    it('ファイルの変更ができる', async () => {
      const metaData = repository.getItemByPath('/foo/bar/baz/testItem.md');

      const result = await metaData.updateContent('hogehoge');
      expect(result.type).toBe(MessageTypeSucceeded);
      const updated = fs.readFileSync(metaData.absolutePath, 'utf8');

      expect(updated).toBe('hogehoge');
    });

    it('isSimilarFile === trueでない場合、MessageTypeFailedが返る', async () => {
      const metaData = repository.getItemByPath('/foo');
      const result = await metaData.updateContent('hogehoge');
      expect(result.type).toBe(MessageTypeFailed);
    });

    it('何らかの理由で親がなかったりするとMessageTypeErrorが返る', async () => {
      const metaData = repository.getItemByPath('/foo/bar/baz/testItem.md');
      fs.unlinkSync(metaData.absolutePath);
      fs.rmdirSync(path.dirname(metaData.absolutePath));

      const result = await metaData.updateContent('hogehoge');
      expect(result.type).toBe(MessageTypeError);
    });
  });

  describe('getContent', () => {
    it('ファイルの内容が取得できる', async () => {
      const metaData = repository.getItemByPath('/foo/bar/baz/testItem.md');

      await metaData.updateContent('hogehoge');
      const [content, result] = await metaData.getContent();
      expect(result.type).toBe(MessageTypeSucceeded);

      expect(content).toBe('hogehoge');
    });

    it('isSimilarFile === trueでない場合、MessageTypeFailedが返る', async () => {
      const metaData = repository.getItemByPath('/foo');
      const [__, result] = await metaData.getContent('hogehoge');

      expect(result.type).toBe(MessageTypeFailed);
    });

    it('実ファイルがなくてもエラーにはならない', async () => {
      const metaData = repository.getItemByPath('/foo/bar/baz/testItem.md');
      fs.unlinkSync(metaData.absolutePath);

      const [content, result] = await metaData.getContent('hogehoge');
      expect(result.type).toBe(MessageTypeSucceeded);
      expect(content).toBe('');
    });
  });
});
