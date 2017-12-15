/* eslint no-continue: 0, no-await-in-loop: 0 */
// @flow

export class Channel<T> {
  _queue: Array<T> = []
  _isClosed: boolean = false;

  constructor(q: Array<T> = []) {
    this._queue = q;
    this._isClosed = false;
  }

  enqueue(item: T): void {
    this._checkClosed();

    this._queue.push(item);
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

      const ret:T = this._queue.shift();

      return ret;
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

function sleep(t: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, t);
  });
}

export default Channel;
