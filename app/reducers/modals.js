// @flow

import {
  type Actions
} from './types';
import {
  OPEN_INPUT_DIALOG,
  CLOSE_DIALOG,
  CLOSE_ALL_DIALOG,
  type InputDialog,
  type UndefinedDialog,
} from '../actions/modals';

export type ModalsState = Array<InputDialog | UndefinedDialog>;

export function initialModalsState() {
  return [];
}

export function modals(
  state: ModalsState = initialModalsState(),
  action: Actions
): ModalsState {
  switch (action.type) {
  case OPEN_INPUT_DIALOG: {
    const newState = state.slice();
    newState.push({
      id: action.payload.modalID,
      type: 'inputDialog',
      label: action.payload.argument.label,
      formValue: action.payload.argument.formValue,
      placeholder: action.payload.argument.placeholder,
      onEnter: action.payload.argument.onEnter,
      onClose: action.payload.argument.onClose
    });

    return newState;
  }
  case CLOSE_DIALOG: {
    const { modalID } = action.payload;
    const idx = state.findIndex((item) => {
      return item.id === modalID;
    });
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
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