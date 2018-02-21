// @flow

import {
  type Actions,
} from './types';
import {
  type WindowID,
} from '../common/window';
import {
  type BrowserState,
  browser,
} from '../reducers/browser';
import {
  type Rectangle,
  INITIALIZE_WINDOWS,
  NEW_WINDOW,
  CLOSE_WINDOW,
  UPDATE_WINDOW_RECTANGLE,
} from '../actions/windows';

export type Window = {
  id: WindowID,
  rectangle: Rectangle,
  browser: BrowserState
};

export type WindowsState = Window[];

export function initialWindowsState() {
  return [];
}

export function windows(state: WindowsState = initialWindowsState(), action: Actions): WindowsState {
  // $FlowFixMe
  const targetWindowID = (action.meta || { targetWindowID: null }).targetWindowID;
  let targetWindows = [];
  if (targetWindowID == null) {
    targetWindows = state;
  } else {
    const win = state.find((item) => {
      return item.id === targetWindowID;
    });
    if (win != null) {
      targetWindows = [win];
    }
  }
  targetWindows.forEach((item) => {
    const beforeBrowserState = item.browser;
    const newBrowserState = browser(item.browser, action);
    if (beforeBrowserState !== newBrowserState) {
      item.browser = newBrowserState; // eslint-disable-line
    }
  });

  switch (action.type) {
  case INITIALIZE_WINDOWS: {
    return action.payload.state;
  }
  case NEW_WINDOW: {
    const newState = state.slice();
    newState.push({
      id: action.payload.windowID,
      rectangle: action.payload.rectangle,
      browser: {
        currentTabID: '',
        tabs: action.payload.tabs,
      }
    });

    return newState;
  }
  case CLOSE_WINDOW: {
    const windowID = action.payload.windowID;
    const idx = state.findIndex((item) => {
      return item.id === windowID;
    });
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
    newState.splice(idx, 1);

    return newState;
  }
  case UPDATE_WINDOW_RECTANGLE: {
    const windowID = action.payload.windowID;
    const idx = state.findIndex((item) => {
      return item.id === windowID;
    });
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
    newState[idx].rectangle = action.payload.rectangle;

    return newState;
  }
  default: return state;
  }
}
