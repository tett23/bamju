/* eslint no-cond-assign: 0, no-loop-func: 0 */
// @flow

import chokidar from 'chokidar';
import { ProjectItem } from './project';
import { Channel } from './channel';

const OperationTypeRegsiter = 'register';
const OperationTypeUnregister = 'unregister';
const OperationTypeUnregisterAll = 'unregister_all';
type OperationType = 'register' | 'unregister' | 'unregister_all';
type FileUpdateEvent = () => void;
type CallbackItem = {
  operation: OperationType,
  projectName: string,
  eventType: string,
  path: string,
  callback: FileUpdateEvent,
  watcher: chokidar.watcher,
  resolve: ()=>{},
  reject: ()=>{}
};

export class FileWatcher {
  _chan: Channel<CallbackItem>
  _tree: {[string]: Node}
  _callbacks: Array<CallbackItem>

  constructor() {
    this._tree = {};
    this._callbacks = [];
    this._chan = new Channel();

    (async () => {
      let item: ?CallbackItem;

      while (item = await this._chan.dequeue()) {
        if (item === undefined || item === null) {
          break;
        }

        if (item.operation === OperationTypeRegsiter) {
          this._removeCallbackItem(item);

          item.watcher = chokidar.watch(item.path);
          item.watcher.on(item.eventType, item.callback);

          this._callbacks.push(item);
        } else if (item.operation === OperationTypeUnregister) {
          this._removeCallbackItem(item);
        } else if (item.operation === OperationTypeUnregisterAll) {
          this._callbacks.forEach((i: CallbackItem) => {
            i.watcher.close();
          });
        }

        item.resolve();
      }
    })();
  }

  _removeCallbackItem(item: CallbackItem): boolean {
    const idx:number = this._callbacks.findIndex((i: CallbackItem) => {
      return i.projectName === item.projectName
              && i.path === item.path
              && i.eventType === item.eventType;
    });

    if (idx !== -1) {
      const oldItem = this._callbacks[idx];

      oldItem.watcher.unwatch(oldItem.path);
      oldItem.watcher.close();
      this._callbacks.splice(idx, 1);

      return true;
    }

    return false;
  }

  register(eventType: string, projectItem: ProjectItem, callback: FileUpdateEvent, recursive: boolean = false): Promise<void> {
    const p:Promise<void> = new Promise((resolve, reject) => {
      this._chan.enqueue({
        operation: OperationTypeRegsiter,
        eventType,
        projectName: projectItem.projectName,
        path: projectItem.absolutePath,
        callback: this.trigger(eventType, projectItem, callback),
        resolve,
        reject
      });
    });

    let ret:Array<Promise<void>> = [p];

    if (recursive) {
      const pp:Array<Promise<void>> = projectItem.items.map((item: ProjectItem): Promise<void> => {
        return new Promise((resolve, reject) => {
          this._chan.enqueue({
            operation: OperationTypeRegsiter,
            eventType,
            projectName: item.projectName,
            path: item.absolutePath,
            callback: this.trigger(eventType, projectItem, callback),
            resolve,
            reject
          });
        });
      });

      ret = ret.concat(pp);
    }

    return Promise.all(ret);
  }

  unregister(eventType: string, projectItem: ProjectItem): Promise<void> {
    const oldItem:?CallbackItem = this._callbacks.find((item: CallbackItem) => {
      return item.projectName === projectItem.projectName
            && item.path === projectItem.path
            && item.eventType === eventType;
    });

    if (oldItem !== undefined && oldItem !== null) {
      return new Promise((resolve, reject) => {
        this._chan.enqueue({
          operation: OperationTypeUnregister,
          eventType,
          projectName: projectItem.projectName,
          path: projectItem.absolutePath,
          callback: oldItem.callback,
          resolve,
          reject
        });
      });
    }

    return Promise.resolve();
  }

  unregisterAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._chan.enqueue({
        operation: OperationTypeUnregisterAll,
        eventType: '',
        projectName: '',
        path: '',
        callback: () => {},
        resolve,
        reject
      });
    });
  }

  trigger(eventType: string, projectItem: ProjectItem, callback: FileUpdateEvent): FileUpdateEvent {
    return (eventType: string, filename: string) => {
      this.unregister(eventType, projectItem);
      // 実行中に呼ばれるかもしれない
      callback(eventType, filename);
      // this.register(eventType, projectItem, callback);
    };
  }
}

const w:FileWatcher = new FileWatcher();

export default w;
