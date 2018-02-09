// @flow
/* eslint flowtype/no-weak-types: 0 */

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
export const MessageTypeSucceeded = 'succeeded';
export const MessageTypeFailed = 'failed';
export const MessageTypeWarning = 'warning';
export const MessageTypeError = 'error';
export const MessageTypeDebug = 'debug';
export type MessageType = 'info' | 'succeeded' | 'failed' | 'warning' | 'error' | 'debug';

export type Message = {
  type: MessageType,
  message: string
};

export function isSimilarError(mes: Message | any): boolean {
  if (mes == null) {
    return false;
  }

  return mes.type === MessageTypeError || mes.type === MessageTypeFailed;
}

export default { sleep };
