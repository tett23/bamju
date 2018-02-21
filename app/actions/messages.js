// @flow

import {
  type Message
} from '../common/util';

export const ADD_MESSAGE = 'ADD_MESSAGE';
export const CLOSE_MESSAGE = 'CLOSE_MESSAGE';
export const CLOSE_ALL_MESSAGES = 'CLOSE_ALL_MESSAGES';

export function addMessage(message: Message, meta: Object = {}) {
  return {
    type: ADD_MESSAGE,
    payload: {
      id: `${Math.random()}`,
      message
    },
    meta
  };
}

export function closeMessage(id: string, meta: Object = {}) {
  return {
    type: CLOSE_MESSAGE,
    payload: {
      id
    },
    meta
  };
}

export function closeAllMessages(meta: Object = {}) {
  return {
    type: CLOSE_ALL_MESSAGES,
    payload: {
    },
    meta
  };
}
