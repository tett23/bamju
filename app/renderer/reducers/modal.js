// @flow

import {
  type ActionTypes
} from './combined';
import {
  OPEN_INPUT_DIALOG,
  CLOSE_DIALOG,
  CLOSE_ALL_DIALOG,
  type ModalType,
  type ModalArgument,
} from '../actions/modal';
import {
  deepCopy,
} from '../../common/util';

type ModalWindow = {
  id: string,
  type: ModalType,
  argument: ModalArgument
};

export type ModalState = ModalWindow[];

export function initialModalState() {
  return [];
}

export function modal(
  state: ModalState = initialModalState(),
  action: ActionTypes
): ModalState {
  switch (action.type) {
  case OPEN_INPUT_DIALOG: {
    const newState = deepCopy(state);
    newState.push({
      id: action.modalID,
      type: action.modalType,
      argument: action.argument
    });

    return newState;
  }
  case CLOSE_DIALOG: {
    const { modalID } = action;
    const idx = state.findIndex((item) => {
      return item.id === modalID;
    });
    if (idx === -1) {
      return state;
    }

    const newState = deepCopy(state);
    newState.splice(idx, 1);

    return newState;
  }
  case CLOSE_ALL_DIALOG: {
    return [];
  }
  default:
    return state;
  }
}

export default initialModalState;
