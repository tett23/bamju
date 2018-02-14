// @flow

import {
  type ActionTypes
} from './combined';
import {
  OPEN_INPUT_DIALOG,
  CLOSE_DIALOG,
  CLOSE_ALL_DIALOG,
  type InputDialog,
  type UndefinedDialog,
} from '../actions/modals';
import {
  deepCopy,
} from '../../common/util';

export type ModalsState = Array<InputDialog | UndefinedDialog>;

export function initialModalsState() {
  return [];
}

export function modals(
  state: ModalsState = initialModalsState(),
  action: ActionTypes
): ModalsState {
  switch (action.type) {
  case OPEN_INPUT_DIALOG: {
    const newState = deepCopy(state);
    newState.push({
      id: action.modalID,
      type: 'inputDialog',
      label: action.argument.label,
      formValue: action.argument.formValue,
      placeholder: action.argument.placeholder,
      onEnter: action.argument.onEnter,
      onClose: action.argument.onClose
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

export default modals;
