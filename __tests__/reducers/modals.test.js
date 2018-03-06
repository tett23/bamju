// @flow

import { createStore } from 'redux';

import {
  initialModalsState,
  modals,
} from '../../app/reducers/modals';
import {
  openInputDialog,
  openSearchDialog,
  closeDialog,
  closeAllDialog,
} from '../../app/actions/modals';
import {
  search
} from '../../app/actions/searches';

let store;
beforeEach(() => {
  store = createStore(modals, initialModalsState());
});

describe('modal reducer', () => {
  describe('OPEN_INPUT_DIALOG', () => {
    it('Dialogを追加できる', () => {
      const arg = {
        type: 'inputDialog',
        label: 'new file',
        formValue: '',
        placeholder: '',
        onEnter: (_) => { return true; },
      };
      store.dispatch(openInputDialog(arg));

      const newState = store.getState();

      expect(newState.length).toBe(1);
      expect(newState[0]).toMatchObject(arg);
    });
  });

  describe('OPEN_SEARCH_DIALOG', () => {
    it('Dialogを追加できる', () => {
      const searchAction = search('', null);
      store.dispatch(searchAction);
      store.dispatch(openSearchDialog('foo'));

      const newState = store.getState();

      expect(newState.length).toBe(1);
      expect(newState[0].type).toBe('searchDialog');
    });
  });

  describe('CLOSE_DIALOG', () => {
    it('Dialogを閉じられる', () => {
      const dialog1 = store.dispatch(openInputDialog({
        label: 'new file',
        formValue: '',
        placeholder: '',
        onEnter: (_) => { return true; },
      }));
      const dialog2 = store.dispatch(openInputDialog({
        label: 'new file',
        formValue: '',
        placeholder: '',
        onEnter: (_) => { return true; },
      }));
      expect(store.getState().length).toBe(2);

      store.dispatch(closeDialog(dialog1.payload.modalID));

      expect(store.getState().length).toBe(1);
      expect(store.getState()[0].id).toBe(dialog2.payload.modalID);
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
