// @flow

export const ModalInputDialog = 'inputDialog';
export const ModalUndefined = '';

export type ModalType = 'inputDialog' | 'undefined';

export type InputArgument = {
  label: string,
  formValue?: string,
  placeholder?: string,
  onEnter: (string) => boolean,
  onClose?: () => boolean
};

export type UndefinedArgument = {};

export type ModalArgument = InputArgument | UndefinedArgument;

export const OPEN_INPUT_DIALOG = 'OPEN_INPUT_DIALOG';
export const CLOSE_DIALOG = 'CLOSE_DIALOG';
export const CLOSE_ALL_DIALOG = 'CLOSE_ALL_DIALOG';

export function openInputDialog(argument: InputArgument) {
  return {
    type: OPEN_INPUT_DIALOG,
    modalID: `${Math.random()}`,
    modalType: 'inputDialog',
    argument,
  };
}

export function closeDialog(id: string) {
  return {
    type: CLOSE_DIALOG,
    modalID: id,
  };
}

export function closeAllDialog() {
  return {
    type: CLOSE_ALL_DIALOG
  };
}
