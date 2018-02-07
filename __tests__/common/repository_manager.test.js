// /* eslint no-undef: 0 */
//
// import {
//   RepositoryManager,
// } from '../../app/common/repository_manager';
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
// let manager: RepositoryManager;
// beforeEach(() => {
//   const dummyBuffers = dummy({
//     test: ['foo']
//   });
//
//   manager = new RepositoryManager(dummyBuffers, [{
//     repositoryName: 'test',
//     absolutePath: '/tmp/bamju/test'
//   }]);
// });
//
//
// describe('RepositoryManager', () => {
//   describe('constructor', () => {
//     it('引数が空なら値も空になる', async () => {
//       manager = new RepositoryManager({}, []);
//
//       await expect(repo.getRepositories()).toMatchObject([]);
//     });
//
//     it('引数のBufferをロードする', async () => {
//       manager = await new RepositoryManager({}, [{
//         repositoryName: 'hoge',
//         absolutePath: '/tmp/bamju-test-test'
//       }]);
//       const repositories = manager.getRepositories();
//
//       await expect(repositories.length).toBe(1);
//       await expect(repositories[0].name).toBe('hoge');
//     });
//
//     it('Configにある項目がRepositoryに存在しなかったら追加する', async () => {
//       manager = await RepositoryManager.init({}, [
//         {
//           repositoryName: 'test1',
//           absolutePath: '/tmp/bamju-test-test1'
//         }, {
//           repositoryName: 'test2',
//           absolutePath: '/tmp/bamju-test-test2'
//         },
//       ]);
//
//       await expect(ret.length).toBe(2);
//       await expect(ret[0].repositoryName).toBe('test1');
//       await expect(ret[1].repositoryName).toBe('test2');
//     });
//
//     // TODO: 同名のリポジトリを追加したときの挙動
//     // TODO: MetaDataはRepositoryの情報もってなくていいのでは？
//   });
//
//   describe('find', () => {
//     it('repositoryを取得できる', () => {
//       expect(manager.find('test').name).toBe('test');
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
//     it('ファイルの検索ができる', () => {
//       const metaData = manager.detect('test', '/foo');
//
//       expect(metaData).toMatchObject({
//         repositoryName: 'test',
//         name: 'foo',
//         path: '/foo'
//       });
//     });
//
//     it('repositoryが存在しない場合、nullが返る', () => {
//       const metaData = manager.detect('not found', '/bar');
//
//       expect(metaData).not.toBe(expect.anything());
//     });
//   });
// });
