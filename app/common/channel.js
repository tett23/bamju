/* eslint no-continue: 0, no-await-in-loop: 0 */
// @flow

import { sleep } from './util';

export class Channel<T> {
  _queue: Array<{value: T, resolve: (any)=>void, reject: (any)=>void}> = []
  _isClosed: boolean = false;

  constructor(q: Array<T> = []) {
    this._queue = q;
    this._isClosed = false;
  }

  enqueue(item: T): Promise<void> {
    this._checkClosed();

    const p:Promise = new Promise((resolve, reject) => {
      this._queue.push({ value: item, resolve, reject });
    });

    return p;
  }

  async dequeue(): Promise<?T> {
    this._checkClosed();

    for (;;) {
      if (this._isClosed) {
        return null;
      }

      if (this._queue.length === 0) {
        await sleep(10);
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
