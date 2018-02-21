// @flow

import {
  type Store,
  type Dispatch,
} from 'redux';
import {
  forwardToMain,
} from 'electron-redux';
import {
  type State,
} from '../reducers/app_window';
import {
  type Actions,
} from '../reducers/types';

export const filterWindowIDMiddleware = (_: Store<State, Actions>) => (next: Dispatch<Actions>) => (action: Actions) => {
  const targetWindowID = (action.meta || { targetWindowID: null }).targetWindowID;
  if (action.meta.fromWindowID !== window.windowID) {
    return next(action);
  }
  if (targetWindowID == null) {
    return next(action);
  }
  if (targetWindowID !== window.windowID) {
    return false;
  }

  return next(action);
};

export const broadcastActionMiddleware = (store: Store<State, Actions>) => (next: Dispatch<Actions>) => (action: Actions) => {
  action.meta.fromWindowID = window.windowID; // eslint-disable-line no-param-reassign

  return forwardToMain(store)(next)(action);
};
