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
} from '../../../app/actions/modals';

import {
  InputDialog,
} from '../../../app/renderer/components/InputDialog';

let store;
beforeEach(() => {
  store = createStore(appReducer, initialState());
});

describe('<InputDialog />', () => {
  it('Escapeが押されるとModalが閉じられる', () => {
    const action = store.dispatch(openInputDialog({
      label: 'hogehoge',
      onEnter: () => {}
    }));
    const component = mountWithStore(<InputDialog id={action.payload.modalID} {...action.payload} />, store);
    expect(store.getState().modals.length).toBe(1);
    expect(store.getState().modals[0].id).toBe(action.payload.modalID);

    component.find('input').simulate('keyUp', {
      key: 'Escape'
    });

    expect(store.getState().modals.length).toBe(0);
  });
});
