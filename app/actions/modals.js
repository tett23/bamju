// @flow

import { type Meta } from '../reducers/types';
import { type Buffer } from '../common/buffer';

export const ModalInputDialog = 'inputDialog';
export const ModalSearchDialog = 'searchDialog';
export const ModalUndefined = 'undefined';

export type ModalType = 'inputDialog' | 'searchDialog' | 'undefined';

export type InputDialogValues = {
  label: string,
  formValue?: string,
  placeholder?: string,
  onEnter: (string) => void | any, // eslint-disable-line
  onClose?: () => void | any // eslint-disable-line
};

export type SearchDialogValues = {
  buffer: ?Buffer
};

export type InputDialog = {
  id: string,
  type: 'inputDialog'
} & InputDialogValues;

export type SearchDialog = {
  id: string,
  type: 'searchDialog'
} & SearchDialogValues;

export type UndefinedDialog = {
  id: string,
  type: 'undefined'
};

export const OPEN_INPUT_DIALOG = 'OPEN_INPUT_DIALOG';
export const OPEN_SEARCH_DIALOG = 'OPEN_SEARCH_DIALOG';
export const CLOSE_DIALOG = 'CLOSE_DIALOG';
export const CLOSE_ALL_DIALOG = 'CLOSE_ALL_DIALOG';

export function openInputDialog(argument: InputDialogValues, meta: Meta = {}) {
  return {
    type: OPEN_INPUT_DIALOG,
    payload: {
      modalType: ModalInputDialog,
      modalID: `${Math.random()}`,
      argument,
    },
    meta: Object.assign({}, meta, {
      scope: 'local' // これがないとelectron-reduxがonEnterを消す
    })
  };
}

export function openSearchDialog(buffer: ?Buffer, meta: Meta = {}) {
  return {
    type: OPEN_SEARCH_DIALOG,
    payload: {
      modalType: ModalSearchDialog,
      modalID: `${Math.random()}`,
      buffer
    },
    meta,
  };
}

export function closeDialog(id: string, meta: Meta = {}) {
  return {
    type: CLOSE_DIALOG,
    payload: {
      modalID: id,
    },
    meta
  };
}

export function closeAllDialog(meta: Meta = {}) {
  return {
    type: CLOSE_ALL_DIALOG,
    payload: {},
    meta
  };
}
