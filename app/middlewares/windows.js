// @flow

import {
  type Store,
  type Dispatch,
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
import {
  parseMetaData as parseMetaDataAction,
} from '../actions/parser';

export const windowsMiddleware = (store: Store<State, Actions>) => (next: Dispatch<Actions>) => (action: Actions) => {
  switch (action.type) {
  case INITIALIZE_WINDOWS: {
    next(action);
    initializeWindows(store, action);
    return;
  }
  case NEW_WINDOW: {
    next(action);
    newWindow(store, action);
    return;
  }
  case CLOSE_WINDOW: {
    next(action);
    closeWindow(store, action);
    return;
  }
  default: {
    return next(action);
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

  manager.createAppWindow({
    id: action.payload.windowID,
    rectangle: action.payload.rectangle,
    tabs: action.payload.tabs,
  });

  action.payload.tabs.forEach((item) => {
    if (item.metaDataID != null) {
      store.dispatch(parseMetaDataAction(item.id, item.metaDataID));
    }
  });
}

function closeWindow(store: Store<State, Actions>, action: $ReturnType<typeof closeWindowAction>) {
  const manager = getWindowManagerInstance();

  manager.removeWindow(action.payload.windowID);
}

export default windowsMiddleware;
