/* eslint no-continue: 0, no-await-in-loop: 0 */
// @flow

import { sleep } from './util';

export class Channel<T> {
  _queue: Array<{value: T, resolve: (any)=>void, reject: (any)=>void}> = []
  _isClosed: boolean = false;

  constructor(q: Array<T> = []) {
    this._queue = q.map((v) => {
      return { value: v, resolve: (_) => {}, reject: (_) => {} };
    });
    this._isClosed = false;

    process.on('SIGINT', () => {
      this.close();
    });
  }

  enqueue(item: T): Promise<void> {
    this._checkClosed();

    const p:Promise<void> = new Promise((resolve, reject) => {
      this._queue.push({ value: item, resolve, reject });
    });

    return p;
  }

  async dequeue(): Promise<?T> {
    this._checkClosed();

    for (;;) {
      await sleep(100);
      console.log('queue length', this._queue.length);
      if (this._isClosed) {
        return null;
      }

      if (this._queue.length === 0) {
        await sleep(100);
        continue;
      }

      const ret:{value: T, resolve: (any)=>void, reject: (any)=>void} = this._queue.shift();

      ret.resolve();

      return ret.value;
    }
  }

  close(): void {
    this._checkClosed();

    this._isClosed = true;
    this._queue = [];
  }

  _checkClosed(): void {
    if (this._isClosed) {
      throw new Error('');
    }
  }
}

export default Channel;
