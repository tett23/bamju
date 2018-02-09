// @flow

import {
  type ActionTypes
} from './combined';
import {
  CLOSE_DIALOG,
  OPEN_NEW_FILE_DIALOG,
  UPDATE_MESSAGE,
  UPDATE_FORM_VALUE,
} from '../actions/modal';
import {
  deepCopy,
} from '../../common/util';

export type ModalState = {
  newFileDialog: {
    isOpened: boolean,
    repositoryName: string,
    formValue: string,
    message: string
  }
};

export function initialModalState() {
  return {
    newFileDialog: {
      isOpened: false,
      repositoryName: '',
      formValue: '',
      message: ''
    }
  };
}

export function modal(
  state: ModalState = initialModalState(),
  action: ActionTypes
): ModalState {
  switch (action.type) {
  case OPEN_NEW_FILE_DIALOG: {
    const newState = deepCopy(state);
    newState.newFileDialog = {
      isOpened: true,
      repositoryName: action.repositoryName,
      formValue: action.formValue,
      message: '',
    };

    return newState;
  }
  case CLOSE_DIALOG: {
    const newState = deepCopy(state);
    newState.newFileDialog = initialModalState.newFileDialog;

    return newState;
  }
  case UPDATE_MESSAGE: {
    const newState = deepCopy(state);
    newState.newFileDialog.message = action.message;

    return newState;
  }
  case UPDATE_FORM_VALUE: {
    const newState = deepCopy(state);
    newState.newFileDialog.formValue = action.formValue;

    return newState;
  }
  default:
    return state;
  }
}

export default initialModalState;
