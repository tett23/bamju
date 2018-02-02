// @flow

import React from 'react';
import { Provider } from 'react-redux';
import EditorApp from './EditorApp';

type RootType = {
  store: {}
};

export default function Root({ store }: RootType) {
  return (
    <Provider store={store}>
      <EditorApp />
    </Provider>
  );
}
