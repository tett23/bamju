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
  ItemTypeUndefined,
  resolveInternalPath,
} from '../../app/common/metadata';
import {
  MessageTypeFailed,
  MessageTypeError,
  MessageTypeSucceeded,
  isSimilarError,
} from '../../app/common/message';

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
  describe('load', () => {
    it('現在のディレクトリが読みこめる', async () => {
      const metaData = repository.getItemByPath('/foo/bar/baz');
      const [newState, result] = await metaData.load();

      expect(result.type).toBe(MessageTypeSucceeded);
      expect(newState.childrenIDs.length).toBe(1);
      expect(newState.isExist('testItem.md')).toBe(true);
    });

    it('すでに管理されているオブジェクトの場合、新たに作られたりはしない', async () => {
      const metaData = repository.getItemByPath('/foo/bar/baz');
      const [newState, result] = await metaData.load();

      expect(result.type).toBe(MessageTypeSucceeded);
      expect(newState.childrenIDs.length).toBe(1);
      expect(newState.childrenIDs[0]).toBe(metaData.childrenIDs[0]);
    });

    it('absolutePathが存在しなくてもエラーになはらない', async () => {
      const metaData = repository.getItemByPath('/foo/bar/baz');
      metaData.children().forEach((item) => {
        fs.unlinkSync(item.absolutePath);
      });
      fs.rmdirSync(metaData.absolutePath);

      const [_, result] = await metaData.load();

      expect(result.type).toBe(MessageTypeSucceeded);
    });

    // TODO: ファイルが存在しなくなった場合、無名ファイルに追加

    it('子のアイテムが存在しなくなった場合はchildrenIDsから削除される', async () => {
      const metaData = repository.getItemByPath('/foo/bar/baz');
      fs.unlinkSync(metaData.children()[0].absolutePath);
      const [newState, result] = await metaData.load();

      expect(result.type).toBe(MessageTypeSucceeded);
      expect(newState.childrenIDs.length).toBe(0);
    });

    it('管理されていなかった子が存在した場合、childrenIDsに追加される', async () => {
      const metaData = repository.getItemByPath('/foo/bar/baz');
      fs.writeFileSync(path.join(metaData.absolutePath, 'new file.md'));

      const [newState, result] = await metaData.load();

      expect(result.type).toBe(MessageTypeSucceeded);
      expect(newState.childrenIDs.length).toBe(2);
      expect(newState.childItem('new file.md')).toMatchObject({
        name: 'new file.md',
        path: '/foo/bar/baz/new file.md',
        parentID: metaData.id,
        childrenIDs: []
      });
    });

    it('子のオブジェクトもloadされる', async () => {
      const rootItem = repository.rootItem();
      fs.mkdirSync(path.join(rootItem.absolutePath, 'recursive test'));
      fs.mkdirSync(path.join(rootItem.absolutePath, 'recursive test', 'a'));
      fs.mkdirSync(path.join(rootItem.absolutePath, 'recursive test', 'a', 'b'));
      fs.mkdirSync(path.join(rootItem.absolutePath, 'recursive test', 'a', 'b', 'c'));
      fs.writeFileSync(path.join(rootItem.absolutePath, 'recursive test', 'a', 'b', 'c', 'testfile.md'), '');

      const [newState, result] = await rootItem.load();

      expect(result.type).toBe(MessageTypeSucceeded);
      let metaData = newState.childItem('recursive test');
      expect(metaData.childrenIDs.length).toBe(1);
      metaData = metaData.childItem('a');
      expect(metaData.childrenIDs.length).toBe(1);
      metaData = metaData.childItem('b');
      expect(metaData.childrenIDs.length).toBe(1);
      const parent = metaData.childItem('c');
      expect(parent.childrenIDs.length).toBe(1);
      metaData = parent.childItem('testfile.md');
      expect(metaData.childrenIDs.length).toBe(0);

      expect(metaData).toMatchObject({
        name: 'testfile.md',
        path: '/recursive test/a/b/c/testfile.md',
        parentID: parent.id,
        childrenIDs: []
      });
    });

    // TODO: 存在しなくなったディレクトリは無名ファイルとする
  });

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

  describe('move', () => {
    let metaData: MetaData;
    beforeEach(async () => {
      let _;
      [metaData, _] = await repository.addFile('/move.md', ''); // eslint-disable-line prefer-const

      fs.mkdirSync('/tmp/bamju/move_test');
      manager.addRepository({
        repositoryName: 'move_test',
        absolutePath: '/tmp/bamju/move_test'
      }, []);
    });

    it('ファイルの移動ができる', async () => {
      const message = await metaData.move(resolveInternalPath('test:/move_test.md'));
      expect(message.type).toBe(MessageTypeSucceeded);
      expect(repository.getItemByID(metaData.id)).toMatchObject({
        ...metaData,
        repositoryName: 'test',
        repositoryPath: '/tmp/bamju/test',
        path: '/move_test.md',
        name: 'move_test.md',
        absolutePath: '/tmp/bamju/test/move_test.md',
      });
      expect(fs.existsSync('/tmp/bamju/test/move.md')).toBe(false);
      expect(fs.existsSync('/tmp/bamju/test/move_test.md')).toBe(true);
    });

    it('repositoryをまたいでファイルの移動ができる', async () => {
      const message = await metaData.move(resolveInternalPath('move_test:/foo.md'));
      expect(message.type).toBe(MessageTypeSucceeded);
      expect(manager.getItemByID(metaData.id)).toMatchObject({
        ...metaData,
        repositoryName: 'move_test',
        repositoryPath: '/tmp/bamju/move_test',
        path: '/foo.md',
        name: 'foo.md',
        absolutePath: '/tmp/bamju/move_test/foo.md',
      });
      expect(fs.existsSync('/tmp/bamju/test/move.md')).toBe(false);
      expect(fs.existsSync('/tmp/bamju/move_test/foo.md')).toBe(true);
    });

    it('repositoryが存在しない場合はエラー', async () => {
      const message = await metaData.move(resolveInternalPath('hogehoge:/move_test.md'));
      expect(isSimilarError(message)).toBe(true);
    });

    it('repositoryName == nullなら同じrepositoryのなかで移動する', async () => {
      const message = await metaData.move(resolveInternalPath('/foo.md'));
      expect(message.type).toBe(MessageTypeSucceeded);
      expect(repository.getItemByID(metaData.id)).toMatchObject({
        ...metaData,
        repositoryName: 'test',
        repositoryPath: '/tmp/bamju/test',
        path: '/foo.md',
        name: 'foo.md',
        absolutePath: '/tmp/bamju/test/foo.md',
      });
    });

    it('pathが絶対パスでない場合はエラー', async () => {
      const message = await metaData.move(resolveInternalPath('move_test.md'));
      expect(isSimilarError(message)).toBe(true);
    });

    it('移動先にMetaDataがすでにある場合はエラー', async () => {
      await repository.addFile('/move_test.md');
      const message = await metaData.move(resolveInternalPath('test:/move_test.md'));
      expect(isSimilarError(message)).toBe(true);
    });

    it('移動先に実ファイルがすでにある場合はエラー', async () => {
      fs.writeFileSync('/tmp/bamju/test/move_test.md');
      const message = await metaData.move(resolveInternalPath('test:/move_test.md'));
      expect(isSimilarError(message)).toBe(true);
    });

    it('DirectoryをFileに変更することはできない', async () => {
      let _;
      [metaData, _] = await repository.addDirectory('/testdir'); // eslint-disable-line prefer-const
      const message = await metaData.move(resolveInternalPath('test:/move_test.md'));
      expect(isSimilarError(message)).toBe(true);
    });

    it('FileをDirectoryに変更することはできない', async () => {
      const message = await metaData.move(resolveInternalPath('test:/move_test'));
      expect(isSimilarError(message)).toBe(true);
    });

    it('不正なItemTypeの場合はエラー', async () => {
      const message = await metaData.move(resolveInternalPath('test:/foo.bar'));
      expect(isSimilarError(message)).toBe(true);
    });

    it('itemTypeの変更ができる', async () => {
      const message = await metaData.move(resolveInternalPath('test:/move_test.txt'));
      expect(message.type).toBe(MessageTypeSucceeded);
      expect(repository.getItemByID(metaData.id)).toMatchObject({
        ...metaData,
        itemType: ItemTypeText
      });
    });

    it('親のディレクトリがない場合は作成する', async () => {
      const message = await metaData.move(resolveInternalPath('test:/a/b/c/deepItem.md'));
      expect(message.type).toBe(MessageTypeSucceeded);
      expect(fs.existsSync('/tmp/bamju/test/move.md')).toBe(false);
      expect(fs.existsSync('/tmp/bamju/test/a')).toBe(true);
      expect(fs.existsSync('/tmp/bamju/test/a/b')).toBe(true);
      expect(fs.existsSync('/tmp/bamju/test/a/b/c')).toBe(true);
      expect(fs.existsSync('/tmp/bamju/test/a/b/c/deepItem.md')).toBe(true);
    });

    it('ItemTypeRepositoryのものは移動できない', async () => {
      metaData = repository.rootItem();
      const message = await metaData.move(resolveInternalPath('test:/move_test.md'));
      expect(isSimilarError(message)).toBe(true);
    });

    it('parentID, childrenIDsが変更される', async () => {
      const message = await metaData.move(resolveInternalPath('test:/parent/move_test.md'));
      expect(message.type).toBe(MessageTypeSucceeded);
      const parent = repository.getItemByPath('/parent');
      expect(repository.getItemByID(metaData.id)).toMatchObject({
        ...metaData,
        parentID: parent.id
      });
      expect(parent.childrenIDs).toMatchObject([metaData.id]);
    });

    it('子のpathが再設定される', async () => {
      await repository.addFile('/a/b/c/move_test.md');
      metaData = repository.getItemByPath('/a');
      await metaData.move(resolveInternalPath('/aa'));
      expect(repository.getItemByPath('/aa/b')).toMatchObject({
        path: '/aa/b',
        absolutePath: '/tmp/bamju/test/aa/b'
      });
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
      const [content, _, result] = await metaData.getContent();
      expect(result.type).toBe(MessageTypeSucceeded);

      expect(content).toBe('hogehoge');
    });

    it('実ファイルがなくてもエラーにはならない', async () => {
      const metaData = repository.getItemByPath('/foo/bar/baz/testItem.md');
      fs.unlinkSync(metaData.absolutePath);

      const [content, _, result] = await metaData.getContent('hogehoge');
      expect(result.type).toBe(MessageTypeSucceeded);
      expect(content).toMatch(/# not found/);
    });
  });

  describe('parse', () => {
    beforeEach(async () => {
      let [item, _] = await repository.addFile('/foo.md');
      item.updateContent('# foo');
      [item, _] = await repository.addFile('/foo.csv');
      item.updateContent('a,b,c');
      [item, _] = await repository.addFile('/foo.tsv');
      item.updateContent('d\te\tf');

      const [dir, __] = await repository.addDirectory('/testDir');
      await dir.addDirectory('foo');

      let [withIndexDir, ___] = await repository.addDirectory('/md index test');
      let [index, ____] = await withIndexDir.addFile('index.md');
      await index.updateContent('# foo');

      [withIndexDir, ___] = await repository.addDirectory('/text index test');
      [index, ____] = await withIndexDir.addFile('index.txt');
      await index.updateContent('# bar');

      [withIndexDir, ___] = await repository.addDirectory('/html index test');
      [index, ____] = await withIndexDir.addFile('index.html');
      await index.updateContent('<h1>baz</h1>');
    });

    it('ファイルが存在しない場合# not foundが返る', async () => {
      const metaData = repository.getItemByPath('/foo.md');
      fs.unlinkSync(metaData.absolutePath);
      const [parseResult, result] = await metaData.parse();

      expect(result.type).toBe(MessageTypeSucceeded);
      expect(parseResult.content).toMatch(/<h1>not found<\/h1>/);
      expect(parseResult.content).toMatch(/<p>test:\/foo.md<\/p>/);
    });

    it('ファイルのパースができる', async () => {
      const metaData = repository.getItemByPath('/foo.md');
      const [parseResult, result] = await metaData.parse();

      expect(result.type).toBe(MessageTypeSucceeded);
      expect(!!parseResult.content.match(/<h1.*?>foo<\/h1>/)).toBe(true);
    });

    it('ディレクトリのパースができる', async () => {
      const metaData = repository.getItemByPath('/testDir');
      const [parseResult, result] = await metaData.parse();

      expect(result.type).toBe(MessageTypeSucceeded);
      expect(!!parseResult.content.match(/<h1.*?>testDir<\/h1>/)).toBe(true);
      expect(parseResult.content).toMatch(/<p><span.*?>foo<\/span><\/p>/m);
    });

    it('ディレクトリをparseしたとき、index.mdが存在すればそちらを開く', async () => {
      const metaData = repository.getItemByPath('/md index test');
      const [parseResult, result] = await metaData.parse();

      expect(result.type).toBe(MessageTypeSucceeded);
      expect(!!parseResult.content.match(/<h1.*?>foo<\/h1>/)).toBe(true);
    });

    it('ディレクトリをparseしたとき、index.txtが存在すればそちらを開く', async () => {
      const metaData = repository.getItemByPath('/text index test');
      const [parseResult, result] = await metaData.parse();

      expect(result.type).toBe(MessageTypeSucceeded);
      expect(!!parseResult.content.match('# bar')).toBe(true);
    });

    it('ディレクトリをparseしたとき、index.htmlが存在すればそちらを開く', async () => {
      const metaData = repository.getItemByPath('/html index test');
      const [parseResult, result] = await metaData.parse();

      expect(result.type).toBe(MessageTypeSucceeded);
      expect(!!parseResult.content.match('<h1>baz</h1>')).toBe(true);
    });

    it('csvのパースができる', async () => {
      const metaData = repository.getItemByPath('/foo.csv');
      const [parseResult, result] = await metaData.parse();

      expect(result.type).toBe(MessageTypeSucceeded);
      expect(!!parseResult.content.match('<table><tr><td>a</td><td>b</td><td>c</td><tr></table>')).toBe(true);
    });

    it('tsvのパースができる', async () => {
      const metaData = repository.getItemByPath('/foo.tsv');
      const [parseResult, result] = await metaData.parse();

      expect(result.type).toBe(MessageTypeSucceeded);
      expect(!!parseResult.content.match('<table><tr><td>d</td><td>e</td><td>f</td><tr></table>')).toBe(true);
    });

    // TODO: tableの中身のタグ解釈
    // TODO: Markdown.parseのcurrentの解釈
    // TODO: aa.md が aaa.md にもマッチする問題
  });
});
