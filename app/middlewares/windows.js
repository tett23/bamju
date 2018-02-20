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
  type ActionTypes,
} from '../reducers/combined';
import {
  INITIALIZE_WINDOWS,
  NEW_WINDOW,
  CLOSE_WINDOW,
  initializeWindows as initializeWindowsAction,
  newWindow as newWindowAction,
  closeWindow as closeWindowAction,
} from '../actions/windows';

export const windowsMiddleware = (store: Store<State, ActionTypes>) => (next: StoreCreator<State, ActionTypes>) => (action: ActionTypes) => {
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
  default: return next(action);
  }
};

function initializeWindows(store: Store<State, ActionTypes>, action: $ReturnType<typeof initializeWindowsAction>) {
  const manager = getWindowManagerInstance();

  action.state.forEach((item) => {
    manager.createAppWindow(item);
  });
}

function newWindow(store: Store<State, ActionTypes>, action: $ReturnType<typeof newWindowAction>) {
  const manager = getWindowManagerInstance();

  manager.createAppWindow({
    id: action.windowID,
    rectangle: action.rectangle,
    tabs: action.tabs
  });
}

function closeWindow(store: Store<State, ActionTypes>, action: $ReturnType<typeof closeWindowAction>) {
  const manager = getWindowManagerInstance();

  manager.removeWindow(action.windowID);
}

export default windowsMiddleware;
