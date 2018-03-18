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
  stack?: string[],
  longStack?: string
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
  const ret = {
    type: type || mes.type,
    message: [text, mes.message].filter(Boolean).join('. '),
    stack: [stack()].concat(mes.stack || []),
    longStack: mes.longStack || Error.captureStackTrace({})
  };
  output(ret);

  return ret;
}

export function create(type: MessageType, text: string): Message {
  const ret = {
    type,
    message: text,
    stack: [stack()],
    longStack: Error.captureStackTrace({})
  };
  output(ret);

  return ret;
}

export function info(mes: string): Message {
  const ret = {
    type: MessageTypeInfo,
    message: mes,
    stack: [stack()],
    longStack: Error.captureStackTrace({})
  };
  output(ret);

  return ret;
}

export function success(mes: string): Message {
  const ret = {
    type: MessageTypeSucceeded,
    message: mes,
    stack: [stack()],
    longStack: Error.captureStackTrace({})
  };
  output(ret);

  return ret;
}

export function warning(mes: string): Message {
  const ret = {
    type: MessageTypeWarning,
    message: mes,
    stack: [stack()],
    longStack: Error.captureStackTrace({})
  };
  output(ret);

  return ret;
}

export function error(mes: string): Message {
  const ret = {
    type: MessageTypeError,
    message: mes,
    stack: [stack()],
    longStack: Error.captureStackTrace({})
  };
  output(ret);

  return ret;
}

export function fail(mes: string): Message {
  const ret = {
    type: MessageTypeFailed,
    message: mes,
    stack: [stack()],
    longStack: Error.captureStackTrace({})
  };
  output(ret);

  return ret;
}

export function debug(mes: string): Message {
  const ret = {
    type: MessageTypeDebug,
    message: mes,
    stack: [stack()],
    longStack: Error.captureStackTrace({})
  };
  output(ret);

  return ret;
}

function output(mes: Message) {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    if (mes.type !== MessageTypeSucceeded) {
      console.log(stringify(mes));
    }
  }
}

function stringify(mes: Message) {
  return `Message(${mes.type}): ${mes.message}\n\t${(mes.stack || []).join('\n\t')}`;
}

function stack(): string {
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
