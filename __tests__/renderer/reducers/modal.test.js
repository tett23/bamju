// @flow

import { createStore } from 'redux';

import {
  initialModalState,
  modal,
} from '../../../app/renderer/reducers/modal';
import {
  openInputDialog,
  closeDialog,
  closeAllDialog,
} from '../../../app/renderer/actions/modal';

let store;
beforeEach(() => {
  store = createStore(modal, initialModalState());
});

describe('modal reducer', () => {
  describe('OPEN_INPUT_DIALOG', () => {
    it('Dialogを追加できる', () => {
      const arg = {
        label: 'new file',
        formValue: '',
        placeholder: '',
        onEnter: (_) => { return true; },
      };
      store.dispatch(openInputDialog(arg));

      const newState = store.getState();

      expect(newState.length).toBe(1);
      expect(newState[0].argument).toMatchObject(arg);
    });
  });

  describe('CLOSE_DIALOG', () => {
    it('Dialogを閉じられる', () => {
      const modalAction = store.dispatch(openInputDialog({
        label: 'new file',
        formValue: '',
        placeholder: '',
        onEnter: (_) => { return true; },
      }));
      expect(store.getState().length).toBe(1);

      store.dispatch(closeDialog(modalAction.modalID));

      expect(store.getState().length).toBe(0);
    });
  });

  describe('CLOSE_ALL_DIALOG', () => {
    it('Dialogをすべて閉じられる', () => {
      store.dispatch(openInputDialog({
        label: 'new file',
        formValue: '',
        placeholder: '',
        onEnter: (_) => { return true; },
      }));
      store.dispatch(openInputDialog({
        label: 'new file',
        formValue: '',
        placeholder: '',
        onEnter: (_) => { return true; },
      }));
      expect(store.getState().length).toBe(2);

      store.dispatch(closeAllDialog());

      expect(store.getState().length).toBe(0);
    });
  });
});
