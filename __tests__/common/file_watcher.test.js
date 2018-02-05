/* eslint no-undef: 0, no-cond-assign: 0, no-await-in-loop: 0, no-empty: 0 */

// import fs from 'fs';
// import watcher from '../../app/common/file_watcher';
// import { Project } from '../../app/common/project';
// import { sleep } from '../../app/common/util';
//
// jest.setTimeout(500);
// global.Promise = require.requireActual('promise');
//
// function rmdir(path:string) {
//   const items = fs.readdirSync(path);
//   items.forEach((item:string) => {
//     const p:string = `${path}/${item}`;
//     const stat:fs.Stats = fs.statSync(p);
//
//     if (stat.isDirectory()) {
//       rmdir(p);
//     } else {
//       fs.unlinkSync(p);
//     }
//   });
//
//   fs.rmdirSync(path);
// }
//
// describe('FileWatcher', () => {
//   let project:Project;
//   let base:string;
//
//   beforeEach(async () => {
//     await watcher.unregisterAll();
//     base = `${__dirname}/../../tmp/test`;
//
//     try {
//       rmdir(base);
//     } catch (e) {}
//     try {
//       fs.mkdirSync(`${base}/../tmp`);
//     } catch (e) {}
//     try {
//       fs.mkdirSync(base);
//     } catch (e) {}
//     try {
//       fs.writeFileSync(`${base}/foo`, 'hogehoge');
//       fs.writeFileSync(`${base}/bar`, 'hogehoge');
//       fs.writeFileSync(`${base}/baz`, 'hogehoge');
//     } catch (e) {}
//
//     project = new Project('test', base);
//   });
//
//   afterEach(() => {
//     rmdir(base);
//   });
//
//   describe('constructor', () => {
//     it('ファイル変更時にcallbackが呼ばれる', async () => {
//       await project.load();
//
//       const item = project.detect('foo');
//       let call = false;
//       await watcher.register('change', item, () => {
//         call = true;
//       });
//       await sleep(100);
//
//       fs.writeFileSync(item.absolutePath, 'hogehoge');
//
//       await sleep(100);
//
//       await expect(call).toBe(true);
//     });
//
//     it('unregisterされるとcallbackが呼ばれなくなる', async () => {
//       await project.load();
//
//       const item = project.detect('baz');
//       let call = false;
//       await watcher.register('change', item, (_:string, __:string) => {
//         call = true;
//       });
//       await sleep(100);
//
//       await watcher.unregister('change', item);
//
//       await sleep(100);
//
//       fs.writeFileSync(item.absolutePath, 'hogehoge');
//
//       await sleep(100);
//
//       await expect(call).toBe(false);
//     });
//
//     it('unregisterAllされるとどのcallbackも呼ばれなくなる', async () => {
//       await project.load();
//
//       const item = project.detect('bar');
//       let call = 1;
//       await watcher.register('change', item, (_:string, __:string) => {
//         call = 2;
//       });
//       await sleep(100);
//
//       await watcher.unregisterAll();
//
//       fs.writeFileSync(item.absolutePath, 'hogehoge');
//
//       await sleep(100);
//
//       await expect(call).toBe(1);
//     });
//
//     it('他のeventTypeをunregisterしても別のeventTypeはregisterされたまま', async () => {
//       await project.load();
//
//       const item = project.detect('bar');
//       let call1 = false;
//       let call2 = false;
//       await watcher.register('change', item, (_:string, __:string) => {
//         call1 = true;
//       });
//       await watcher.register('unlink', item, (_:string, __:string) => {
//         call2 = true;
//       });
//       await sleep(100);
//
//       await watcher.unregister('change', item);
//
//       await sleep(100);
//
//       fs.writeFileSync(item.absolutePath, 'hogehoge');
//       fs.unlinkSync(item.absolutePath);
//
//       await sleep(100);
//
//       await expect(call1).toBe(false);
//       await expect(call2).toBe(true);
//     });
//   });
// });
