// @flow

import * as React from 'react';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { createStore } from 'redux';

import {
  appReducer,
  initialState,
} from '../../../app/renderer/reducers/combined';
import {
  bufferUpdated,
} from '../../../app/renderer/actions/tab';

import Tab from '../../../app/renderer/components/Tab';

Enzyme.configure({ adapter: new Adapter() });

const mountWithStore = (component, store) => {
  const context = {
    store,
  };

  return Enzyme.mount(component, { context });
};

let store;
beforeEach(() => {
  store = createStore(appReducer, initialState());
});

describe('<Tab />', () => {
  it('contentの内容が表示できる', () => {
    const tab = store.getState().browser.tabs[0];
    store.dispatch(bufferUpdated(tab.buffer, 'hogehoge'));
    tab.content = 'hogehoge';
    console.log(tab);

    const component = mountWithStore(<Tab buffer={tab.buffer} content={tab.content} />, store);

    expect(component.find('.markdown-body').text()).toBe('hogehoge');
  });

  it('Breadcrumbの内容が表示できる', () => {
    const tab = store.getState().browser.tabs[0];
    tab.buffer.path = '/foo/bar/baz';
    store.dispatch(bufferUpdated(tab.buffer, 'hogehoge'));

    const component = mountWithStore(<Tab buffer={tab.buffer} content={tab.content} />, store);
    console.log(component.debug());

    expect(component.find('.markdown-body').text()).toBe('hogehoge');
  });
});
