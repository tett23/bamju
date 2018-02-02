// @flow

export const CLOSE_DIALOG = 'CLOSE_DIALOG';
export const OPEN_NEW_FILE_DIALOG = 'OPEN_NEW_FILE_DIALOG';
export const UPDATE_MESSAGE = 'UPDATE_FILE_DIALOG_MESSAGE';
export const UPDATE_FORM_VALUE = 'UPDATE_FILE_DIALOG_FORM_VALUE';

export function closeDialog() {
  return {
    type: CLOSE_DIALOG
  };
}

export function openNewFileDialog(projectName: string, formValue: string) {
  return {
    type: OPEN_NEW_FILE_DIALOG,
    projectName,
    formValue
  };
}

export function updateMessage(message: string) {
  return {
    type: UPDATE_MESSAGE,
    message,
  };
}

export function updateFormValue(value: string) {
  return {
    type: UPDATE_FORM_VALUE,
    formValue: value
  };
}

export default {
  closeDialog,
  openNewFileDialog
};
