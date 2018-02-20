// @flow

import {
  type Store,
  type StoreCreator,
} from 'redux';

import {
  getInstance as getWindowManagerInstance,
} from '../common/window_manager';

import {
  type $ReturnType,
} from '../common/util';

import {
  type State,
  type Actions,
} from '../reducers/main';
import {
  INITIALIZE_WINDOWS,
  NEW_WINDOW,
  CLOSE_WINDOW,
  initializeWindows as initializeWindowsAction,
  newWindow as newWindowAction,
  closeWindow as closeWindowAction,
} from '../actions/windows';

export const windowsMiddleware = (store: Store<State, Actions>) => (next: StoreCreator<State, Actions>) => (action: Actions) => {
  switch (action.type) {
  case INITIALIZE_WINDOWS: {
    next(action);
    initializeWindows(store, action);
    return;
  }
  case NEW_WINDOW: {
    const a = next(action);
    console.log('hogehoge', a);

    newWindow(store, action);
    return;
  }
  case CLOSE_WINDOW: {
    next(action);
    closeWindow(store, action);
    return;
  }
  default: {
    next(action);
  }
  }
};

function initializeWindows(store: Store<State, Actions>, action: $ReturnType<typeof initializeWindowsAction>) {
  const manager = getWindowManagerInstance();

  action.payload.state.forEach((item) => {
    manager.createAppWindow(item);
  });
}

function newWindow(store: Store<State, Actions>, action: $ReturnType<typeof newWindowAction>) {
  const manager = getWindowManagerInstance();

  manager.createAppWindow(action.payload);
}

function closeWindow(store: Store<State, Actions>, action: $ReturnType<typeof closeWindowAction>) {
  const manager = getWindowManagerInstance();

  manager.removeWindow(action.payload.windowID);
}

export default windowsMiddleware;
