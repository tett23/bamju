/* eslint no-undef: 0, no-cond-assign: 0, no-await-in-loop: 0 */

import { Channel } from '../../app/common/channel';

jest.setTimeout(5000);
global.Promise = require.requireActual('promise');

describe('Channel', () => {
  let chan:Channel;

  beforeEach(() => {
    chan = new Channel();
  });

  describe('constructor', () => {
    it('引数なし', () => {
      chan = new Channel();
      expect(chan._queue.length).toBe(0);
    });

    it('引数あり', () => {
      chan = new Channel([1, 2, 3]);
      expect(chan._queue.length).toBe(3);
      expect(chan._queue[0]).toBe(1);
      expect(chan._queue[1]).toBe(2);
      expect(chan._queue[2]).toBe(3);
    });
  });

  describe('enqueue', () => {
    it('キュー', () => {
      chan.enqueue(1);

      expect(chan._queue.length).toBe(1);
      expect(chan._queue[0].value).toBe(1);
    });

    it('キューの中身が読みだされたらresolveされる', async () => {
      const p:Promise<void> = chan.enqueue(1);

      expect(chan._queue.length).toBe(1);
      expect(chan._queue[0].value).toBe(1);

      await p;

      await chan.enqueue(1);

      await expect(chan._queue.length).toBe(0);
    });
  });

  describe('dequeue', () => {
    it('値の取りだし', async () => {
      chan.enqueue(1);

      await expect(chan.dequeue()).resolves.toBe(1);
    });

    it('キューに詰めた順番で取りだせる', async () => {
      const values = [1, 2, 3, 4, 5];
      const received = [];

      const p:Promise = (async () => {
        while (received.length !== values.length) {
          const v = await chan.dequeue();
          received.push(v);
        }

        return 1;
      })();

      const pp:Array<Promise> = values.map((async (v) => {
        chan.enqueue(v);
        return 10;
      }));

      pp.push(p);
      await Promise.all(pp);

      expect(received).toEqual(values);
    });
  });

  describe('close', () => {
    it('closeしたあとは操作できない', async () => {
      chan.enqueue(1);
      await chan.dequeue();

      chan.close();

      expect(() => { chan.enqueue(1); }).toThrow();
      expect(chan.dequeue()).rejects.toThrow();
    });

    it('dequeue待ちの状態でcloseすると、dequeueはnullを返して終了する', async () => {
      const p = chan.dequeue();

      chan.close();

      const v = await p;
      await expect(v).toBe(null);
    });
  });
});

function sleep(t: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, t);
  });
}
