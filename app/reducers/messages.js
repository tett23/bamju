// @flow

import {
  type Actions
} from './app_window';
import {
  ADD_MESSAGE,
  CLOSE_MESSAGE,
  CLOSE_ALL_MESSAGES,
} from '../actions/messages';
import {
  deepCopy,
  type Message,
} from '../common/util';

export type MessagesState = Array<{
  id: string,
  message: Message
}>;

export function initialMessagesState(): MessagesState {
  return [];
}

export function messages(state: MessagesState = initialMessagesState(), action: Actions): MessagesState {
  switch (action.type) {
  case ADD_MESSAGE: {
    const newState = deepCopy(state);

    newState.push({ id: action.id, message: action.message });

    return newState;
  }
  case CLOSE_MESSAGE: {
    const { id } = action;
    const idx = state.findIndex((item) => {
      return item.id === id;
    });
    if (idx === -1) {
      return state;
    }

    const newState = deepCopy(state);
    newState.splice(idx, 1);

    return newState;
  }
  case CLOSE_ALL_MESSAGES: {
    return [];
  }
  default:
    return state;
  }
}
