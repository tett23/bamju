// @flow

export const CLOSE_DIALOG = 'CLOSE_DIALOG';
export const OPEN_NEW_FILE_DIALOG = 'OPEN_NEW_FILE_DIALOG';

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

export default {
  closeDialog,
  openNewFileDialog
};
