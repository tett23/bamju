// @flow

import React from 'react';
import { Editor } from '../components/Editor';
import { Messages } from '../components/Messages';

const app = () => {
  return (
    <div data-tid="app">
      <Editor />
      <Messages />
    </div>
  );
};

export const App = app;
export default app;
