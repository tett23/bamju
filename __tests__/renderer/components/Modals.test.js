// @flow

import * as React from 'react';
import { createStore } from 'redux';

import '../../global_config.test';
import { mountWithStore } from '../../test_utils';

import {
  appReducer,
  initialState,
} from '../../../app/reducers/app_window';
import {
  openInputDialog,
  openSearchDialog,
} from '../../../app/actions/modals';

import {
  Modals,
} from '../../../app/renderer/components/Modals';

let store;
beforeEach(() => {
  store = createStore(appReducer, initialState());
});

describe('<Modals />', () => {
  it('openInputDialogでInputDialogが作られる', () => {
    store.dispatch(openInputDialog({
      label: 'hogehoge',
      onEnter: () => {}
    }));
    const component = mountWithStore(<Modals modals={store.getState().modals} />, store);

    expect(component.find('.dialogs').length).toBe(1);
  });

  it('openSearchDialogでSearchDialogが作られる', () => {
    store.dispatch(openSearchDialog());
    const component = mountWithStore(<Modals modals={store.getState().modals} />, store);

    expect(component.find('.dialogs').length).toBe(1);
  });

  it('modalsが空のときは何も表示されない', () => {
    const component = mountWithStore(<Modals />, store);

    expect(component.find('.dialogs').children().length).toBe(0);
  });

  it('背景のonClickで全てのDialogが破棄される', () => {
    store.dispatch(openInputDialog({
      label: 'hogehoge',
      onEnter: () => {}
    }));
    const component = mountWithStore(<Modals />, store);

    expect(store.getState().modals.length).toBe(1);
    expect(component.find('.dialogs').children().length).toBe(1);

    component.find('.modals').simulate('click');

    expect(store.getState().modals.length).toBe(0);
  });

  it('Escが押されると全てのDialogが破棄される', () => {
    store.dispatch(openInputDialog({
      label: 'hogehoge',
      onEnter: () => {}
    }));
    const component = mountWithStore(<Modals />, store);

    expect(store.getState().modals.length).toBe(1);
    expect(component.find('.dialogs').children().length).toBe(1);

    component.find('.modals').simulate('keyUp', {
      key: 'Escape'
    });

    expect(store.getState().modals.length).toBe(0);
  });
});
