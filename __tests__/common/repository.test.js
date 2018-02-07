// /* eslint no-undef: 0 */
//
// import {
//   RepositoryManager,
// } from '../../app/common/repository_manager';
// import {
//   Repository,
// } from '../../app/common/repository';
// import {
//   ItemTypeMarkdown,
//   ItemTypeDirectory,
// } from '../../app/common/metadata';
// import {
//   MessageTypeFailed,
//   MessageTypeSucceeded
// } from '../../app/common/util';
//
//
// import {
//   dummy,
// } from '../test_utils';
//
// jest.setTimeout(500);
//
// let repository: Repository;
// beforeEach(() => {
//   const dummyBuffers = dummy({
//     test: ['foo']
//   });
//
//   repository = new Repository(dummyBuffers.test, {
//     repositoryName: 'test',
//     absolutePath: '/tmp/bamju/test'
//   });
// });
//
// describe('Repository', () => {
//   describe('init', () => {
//   });
//
//   describe('addFile', () => {
//     it('ファイルの追加ができる', async () => {
//       const [metaData, result] = await repository.addFile('test', '/hoge.md');
//
//       await expect(result.type).toBe(MessageTypeSucceeded);
//       await expect(metaData).toMatchObject({
//         name: 'hoge.md',
//         path: '/hoge.md',
//         repositoryName: 'test',
//         absolutePath: '/tmp/bamju-test-test/hoge.md',
//         itemType: ItemTypeMarkdown,
//         repositoryPath: '/tmp/bamju-test-test',
//       });
//     });
//
//     it('同名のファイルを作ろうとするとFailedのメッセージが返る', async () => {
//       let [_, result] = await repository.addFile('test', '/hoge.md');
//       await expect(result.type).toBe(MessageTypeSucceeded);
//
//       [_, result] = await RepositoryManager.addFile('test', '/hoge.md');
//       await expect(result.type).toBe(MessageTypeFailed);
//     });
//
//     it('repositoryが存在しない場合、Failedのメッセージが返る', async () => {
//       const [_, result] = await repository.addFile('not found', '/hoge.md');
//
//       await expect(result.type).toBe(MessageTypeFailed);
//     });
//
//     it('親のディレクトリがなくてもSucceededのメッセージが返る', async () => {
//       const [metaData, result] = await repository.addFile('test', '/foo/bar/baz.md');
//
//       await expect(result.type).toBe(MessageTypeSucceeded);
//       expect(metaData).toMatchObject({
//         path: '/foo/bar/baz.md',
//       });
//     });
//
//     it('絶対パスでない場合、Failedのメッセージが返る', async () => {
//       const [_, result] = await repository.addFile('test', 'hoge.md');
//
//       await expect(result.type).toBe(MessageTypeFailed);
//     });
//
//     it('.を含むパスを解釈できる', async () => {
//       const [metaData, result] = await repository.addFile('test', '/foo/./baz.md', { recursive: true });
//
//       await expect(result.type).toBe(MessageTypeSucceeded);
//
//       expect(metaData).toMatchObject({
//         path: '/foo/baz.md',
//       });
//     });
//
//     it('..を含むパスを解釈できる', async () => {
//       const [metaData, result] = await repository.addFile('test', '/foo/bar/../baz.md', { recursive: true });
//
//       await expect(result.type).toBe(MessageTypeSucceeded);
//
//       expect(metaData).toMatchObject({
//         path: '/foo/baz.md',
//       });
//     });
//   });
//   o;
//   describe('addDirectory', () => {
//     it('ディレクトリの作成ができる', async () => {
//       const [metaData, result] = await repository.addDirectory('test', '/hoge');
//
//       await expect(result.type).toBe(MessageTypeSucceeded);
//       await expect(metaData).toMatchObject({
//         name: 'hoge',
//         path: '/hoge',
//         repositoryName: 'test',
//         absolutePath: '/tmp/bamju-test-test/hoge',
//         itemType: ItemTypeDirectory,
//         repositoryPath: '/tmp/bamju-test-test',
//       });
//     });
//
//     it('ディレクトリは再帰的に作成される', async () => {
//       const [metaData, result] = await repository.addDirectory('test', '/foo/bar/baz');
//
//       await expect(result.type).toBe(MessageTypeSucceeded);
//       await expect(metaData).toMatchObject({
//         name: 'baz',
//         path: '/foo/bar/baz',
//         repositoryName: 'test',
//         absolutePath: '/tmp/bamju-test-test/foo/bar/baz',
//         itemType: ItemTypeDirectory,
//         repositoryPath: '/tmp/bamju-test-test',
//       });
//     });
//
//     it('ファイル名に.を含む場合Failedのメッセージが返る', async () => {
//       const [_, result] = await repository.addDirectory('test', '/foo/bar/baz.a');
//
//       await expect(result.type).toBe(MessageTypeFailed);
//     });
//
//     it('repositoryが存在しない場合、Failedのメッセージが返る', async () => {
//       const [_, result] = await repository.addDirectory('not found', '/hoge');
//
//       await expect(result.type).toBe(MessageTypeFailed);
//     });
//
//     it('同名のディレクトリを作っても中身が消えたりしない（別のオブジェクトに差し替えられたりしない）', async () => {
//       let [dir, result] = await repository.addDirectory('test', '/hoge', { recursive: false });
//       await expect(result.type).toBe(MessageTypeSucceeded);
//
//       await dir.addFile('foo.md');
//       const item = repository.detect('test', '/hoge/foo.md');
//       expect(item.path).toBe('/hoge/foo.md');
//
//       [dir, result] = await RepositoryManager.addDirectory('test', '/hoge');
//       await expect(result.type).toBe(MessageTypeSucceeded);
//     });
//
//     it('絶対パスでない場合、Failedのメッセージが返る', async () => {
//       const [_, result] = await repository.addDirectory('test', 'hoge');
//
//       await expect(result.type).toBe(MessageTypeFailed);
//     });
//
//     it('.を含むパスを解釈できる', async () => {
//       const [metaData, result] = await repository.addDirectory('test', '/foo/./baz', { recursive: true });
//
//       await expect(result.type).toBe(MessageTypeSucceeded);
//
//       expect(metaData).toMatchObject({
//         path: '/foo/baz',
//       });
//     });
//
//     it('..を含むパスを解釈できる', async () => {
//       const [metaData, result] = await repository.addDirectory('test', '/foo/bar/../baz', { recursive: true });
//
//       await expect(result.type).toBe(MessageTypeSucceeded);
//
//       expect(metaData).toMatchObject({
//         path: '/foo/baz',
//       });
//     });
//   });
//
//   describe('find', () => {
//     it('ファイルの検索ができる', () => {
//       expect(manager.find('test')).toMatchObject({
//         repositoryName: 'test',
//         path: '/'
//       });
//     });
//
//     it('repositoryが存在しない場合はnullを返す', () => {
//       expect(manager.find('hoge')).not.toBe(expect.anything());
//     });
//   });
//
//   describe('isExist', () => {
//     it('repositoryが存在する場合はtrueを返す', () => {
//       expect(manager.isExist('test')).toBe(true);
//     });
//
//     it('repositoryが存在しない場合はfalseを返す', () => {
//       expect(manager.isExist('hgoe')).toBe(false);
//     });
//   });
//
//   describe('detect', () => {
//     beforeEach(() => {
//       const dummy = createBufferTree('test', { foo: {} });
//       RepositoryManager.init([dummy], [{
//         repositoryName: 'test',
//         absolutePath: '/tmp/bamju-test-test'
//       }]);
//     });
//
//     it('ファイルの検索ができる', () => {
//       const metaData = RepositoryManager.detect('test', '/foo');
//
//       expect(metaData).toMatchObject({
//         repositoryName: 'test',
//         name: 'foo',
//         path: '/foo'
//       });
//     });
//
//     it('repositoryが存在しない場合、nullが返る', () => {
//       const metaData = RepositoryManager.detect('not found', '/hoge.md');
//
//       expect(metaData).not.toBe(expect.anything());
//     });
//   });
// });
