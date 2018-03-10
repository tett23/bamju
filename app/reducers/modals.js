// @flow

import {
  type Actions
} from './types';
import {
  OPEN_INPUT_DIALOG,
  OPEN_SEARCH_DIALOG,
  CLOSE_DIALOG,
  CLOSE_ALL_DIALOG,
  CLOSE_SEARCH_DIALOG,
  type InputDialog,
  type SearchDialog,
  type UndefinedDialog,
} from '../actions/modals';

export type ModalsState = Array<InputDialog | SearchDialog | UndefinedDialog>;

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
  case OPEN_SEARCH_DIALOG: {
    const newState = state.slice();
    newState.push({
      id: action.payload.modalID,
      type: 'searchDialog',
      queryID: action.payload.queryID,
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
  case CLOSE_SEARCH_DIALOG: {
    const idx = state.findIndex((item) => {
      return item.type === 'searchDialog' && item.queryID === action.payload.queryID;
    });
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
    newState.splice(idx, 1);

    return newState;
  }
  default:
    return state;
  }
}

export default modals;
