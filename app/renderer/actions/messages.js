// @flow

import {
  type Message
} from '../../common/util';

export const ADD_MESSAGE = 'ADD_MESSAGE';
export const CLOSE_MESSAGE = 'CLOSE_MESSAGE';
export const CLOSE_ALL_MESSAGES = 'CLOSE_ALL_MESSAGES';

export function addMessage(message: Message, id: Symbol = Symbol('message')) {
  return {
    type: ADD_MESSAGE,
    id,
    message
  };
}

export function closeMessage(id: Symbol) {
  return {
    type: CLOSE_MESSAGE,
    id
  };
}

export function closeAllMessages() {
  return {
    type: CLOSE_ALL_MESSAGES,
  };
}
