// @flow

export const ModalInputDialog = 'inputDialog';
export const ModalUndefined = 'undefined';

export type ModalType = 'inputDialog' | 'undefined';

export type InputDialogValues = {
  label: string,
  formValue?: string,
  placeholder?: string,
  onEnter: (string) => void | any, // eslint-disable-line
  onClose?: () => void | any // eslint-disable-line
};

export type InputDialog = {
  id: string,
  type: 'inputDialog'
} & InputDialogValues;

export type UndefinedDialog = {
  id: string,
  type: 'undefined'
};

export const OPEN_INPUT_DIALOG = 'OPEN_INPUT_DIALOG';
export const CLOSE_DIALOG = 'CLOSE_DIALOG';
export const CLOSE_ALL_DIALOG = 'CLOSE_ALL_DIALOG';

export function openInputDialog(argument: InputDialogValues, meta: Object = {}) {
  return {
    type: OPEN_INPUT_DIALOG,
    payload: {
      modalType: ModalInputDialog,
      modalID: `${Math.random()}`,
      argument,
    },
    meta: Object.assign(meta, {
      scope: 'local' // これがないとelectron-reduxがonEnterを消す
    })
  };
}

export function closeDialog(id: string, meta: Object = {}) {
  return {
    type: CLOSE_DIALOG,
    payload: {
      modalID: id,
    },
    meta
  };
}

export function closeAllDialog(meta: Object = {}) {
  return {
    type: CLOSE_ALL_DIALOG,
    payload: {},
    meta
  };
}
