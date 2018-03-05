// @flow

import {
  type Store,
  type Dispatch,
} from 'redux';
import {
  forwardToMain,
  forwardToRenderer,
} from 'electron-redux';
import {
  type State as WindowState,
} from '../reducers/app_window';
import {
  type Actions,
} from '../reducers/types';

export const filterWindowIDMiddleware = (_: Store<WindowState, Actions>) => (next: Dispatch<Actions>) => (action: Actions) => {
  const targetWindowID = (action.meta || { targetWindowID: null }).targetWindowID;

  if (targetWindowID == null || targetWindowID === window.windowID) {
    return next(action);
  }
};

export const broadcastMainMiddleware = (store: Store<WindowState, Actions>) => (next: Dispatch<Actions>) => (action: Actions) => {
  if (action.meta.broadcastFrom === 'main') {
    return next(action);
  }

  /* eslint-disable no-param-reassign */
  action.meta.fromWindowID = window.windowID;
  action.meta.targetWindowID = window.windowID;
  action.meta.broadcastFrom = 'renderer';
  /* eslint-enable */

  return forwardToMain(store)(next)(action);
};

export const broadcastRendererMiddleware =
(store: Store<WindowState, Actions>) => (next: Dispatch<Actions>) => (action: Actions) => {
  action.meta.broadcastFrom = 'main'; // eslint-disable-line no-param-reassign

  return forwardToRenderer(store)(next)(action);
};
