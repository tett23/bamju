// @flow

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

// eslint-disable-next-line flowtype/no-weak-types
export function isSimilarError(mes: Message | any): boolean {
  if (mes == null) {
    return false;
  }

  if (mes.type == null) {
    return false;
  }

  return mes.type === MessageTypeError || mes.type === MessageTypeFailed;
}

// eslint-disable-next-line flowtype/no-weak-types
export function isSimilarMessage(mes: Message | any): boolean {
  return mes.type != null;
}
