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
  message: string,
  stack?: string[]
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

export function wrap(mes: Message, text?: string, type?: MessageType): Message {
  return {
    type: type || mes.type,
    message: [text, mes.message].filter(Boolean).join('. '),
    stack: [stack()].concat(mes.stack || [])
  };
}

export function create(type: MessageType, text: string): Message {
  return {
    type,
    message: text,
    stack: [stack()]
  };
}

export function success(mes: string): Message {
  return {
    type: MessageTypeSucceeded,
    message: mes,
    stack: [stack()]
  };
}

export function error(mes: string): Message {
  return {
    type: MessageTypeError,
    message: mes,
    stack: [stack()]
  };
}

export function fail(mes: string): Message {
  return {
    type: MessageTypeFailed,
    message: mes,
    stack: [stack()]
  };
}

export function stack(): string {
  const a = {};
  Error.captureStackTrace(a);

  const mes = a.stack.split('\n').slice(1).find((item) => {
    return !item.match(/message.js/);
  });
  if (mes == null) {
    return '';
  }

  return mes.trim();
}

export default {
  MessageTypeInfo,
  MessageTypeSucceeded,
  MessageTypeDebug,
  MessageTypeError,
  MessageTypeFailed,
  MessageTypeWarning,
  isSimilarError,
  isSimilarMessage,
  wrap,
  create,
  success,
  error,
  fail,
};
