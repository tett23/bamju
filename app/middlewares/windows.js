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
} from '../reducers/main';
import {
  type Actions,
} from '../reducers/types';
import {
  INITIALIZE_WINDOWS,
  WINDOW_INITIALIZED,
  NEW_WINDOW,
  CLOSE_WINDOW,
  initializeWindows as initializeWindowsAction,
  windowInitialized as windowInitializedAction,
  newWindow as newWindowAction,
  closeWindow as closeWindowAction,
} from '../actions/windows';
import {
  parseMetaData,
} from '../actions/parser';

export const windowsMiddleware = (store: Store<State, Actions>) => (next: Dispatch<Actions>) => (action: Actions) => {
  switch (action.type) {
  case INITIALIZE_WINDOWS: {
    next(action);
    initializeWindows(store, action);
    return;
  }
  case WINDOW_INITIALIZED: {
    next(action);
    windowInitialized(store, action);
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

function windowInitialized(store: Store<State, Actions>, action: $ReturnType<typeof windowInitializedAction>) {
  const manager = getWindowManagerInstance();

  const win = manager.findAppWindow(action.payload.windowID);
  if (win == null) {
    return;
  }

  win.conf.browser.tabs.forEach((item) => {
    if (item.metaDataID == null) {
      return;
    }

    store.dispatch(parseMetaData(item.id, item.metaDataID, { targetWindowID: action.meta.fromWindowID }));
  });
}

function newWindow(store: Store<State, Actions>, action: $ReturnType<typeof newWindowAction>) {
  const manager = getWindowManagerInstance();

  manager.createAppWindow({
    id: action.payload.windowID,
    rectangle: action.payload.rectangle,
    browser: {
      currentTabID: action.payload.tabs[0].id,
      tabs: action.payload.tabs,
    },
    repositoriesTreeView: {}
  });
}

function closeWindow(store: Store<State, Actions>, action: $ReturnType<typeof closeWindowAction>) {
  const manager = getWindowManagerInstance();

  manager.removeWindow(action.payload.windowID);
}

export default windowsMiddleware;
