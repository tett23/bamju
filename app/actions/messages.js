// @flow

import {
  type Message
} from '../common/util';

export const ADD_MESSAGE = Symbol('ADD_MESSAGE');
export const CLOSE_MESSAGE = Symbol('CLOSE_MESSAGE');
export const CLOSE_ALL_MESSAGES = Symbol('CLOSE_ALL_MESSAGES');

export function addMessage(message: Message) {
  return {
    type: ADD_MESSAGE,
    id: `${Math.random()}`,
    message
  };
}

export function closeMessage(id: string) {
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
