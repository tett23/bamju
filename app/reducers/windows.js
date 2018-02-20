// @flow

import {
  type Actions,
} from './app_window';
import {
  type Window,
  INITIALIZE_WINDOWS,
  NEW_WINDOW,
  CLOSE_WINDOW,
  UPDATE_WINDOW_RECTANGLE,
} from '../actions/windows';

export type WindowsState = Window[];

export function initialWindowsState() {
  return [];
}

export function windows(state: WindowsState = initialWindowsState(), action: Actions): WindowsState {
  switch (action.type) {
  case INITIALIZE_WINDOWS: {
    return action.payload.state;
  }
  case NEW_WINDOW: {
    const newState = state.slice();
    newState.push({
      id: action.payload.windowID,
      rectangle: action.payload.rectangle,
      tabs: action.payload.tabs,
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
