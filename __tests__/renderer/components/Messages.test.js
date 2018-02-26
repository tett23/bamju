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
  addMessage,
} from '../../../app/actions/messages';
import {
  MessageTypeInfo
} from '../../../app/common/message';

import {
  Messages,
} from '../../../app/renderer/components/Messages';

let store;
beforeEach(() => {
  store = createStore(appReducer, initialState());
});

describe('<Messages />', () => {
  it('messagesの内容が表示できる', () => {
    store.dispatch(addMessage({
      type: MessageTypeInfo,
      message: 'messages test1'
    }));
    store.dispatch(addMessage({
      type: MessageTypeInfo,
      message: 'messages test2'
    }));

    const component = mountWithStore(<Messages messages={store.getState().messages} />, store);

    const messageComponents = component.find('message');
    expect(messageComponents.length).toBe(2);
    expect(messageComponents.at(0).find('.messageBody').text()).toBe('messages test1');
    expect(messageComponents.at(0).find('.messageBody').text()).toBe('messages test1');
  });

  it('messagesが空のときはMessageは作られない', () => {
    const component = mountWithStore(<Messages messages={[]} />, store);

    expect(component.find('Message').length).toBe(0);
  });
});
