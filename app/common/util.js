// @flow

export function sleep(t: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, t);
  });
}

export function deepCopy<T>(obj: T): T {
  // FIXME: そのうちちゃんとしたのにする
  return JSON.parse(JSON.stringify(obj));
}

export function deepMerge<T>(obj: T, update: Object): T {
  return Object.assign({}, deepCopy(obj), update);
}

export const MessageTypeInfo = 'info';
export const MessageTypeDebug = 'debug';
export const MessageTypeWarning = 'warning';
export const MessageTypeError = 'error';
export type MessageType = 'info' | 'debug' | 'warning' | 'error';

export type Message = {
  success: boolean,
  type: MessageType,
  message: string
};

export default { sleep };
