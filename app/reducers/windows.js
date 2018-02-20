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
  ADD_TAB,
  CLOSE_TAB,
  UPDATE_TAB,
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
  case ADD_TAB: {
    const windowID = action.payload.windowID;
    const idx = state.findIndex((item) => {
      return item.id === windowID;
    });
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
    newState[idx].tabs.push({
      id: action.payload.tabID,
      metaDataID: action.payload.metaDataID,
      content: action.payload.content,
    });

    return newState;
  }
  case CLOSE_TAB: {
    const { windowID, tabID } = action.payload;
    const windowIdx = state.findIndex((item) => {
      return item.id === windowID;
    });
    if (windowIdx === -1) {
      return state;
    }
    const tabIdx = state[windowIdx].tabs.findIndex((item) => {
      return item.id === tabID;
    });
    if (tabIdx === -1) {
      return state;
    }

    const newState = state.slice();
    newState[windowIdx].tabs.splice(tabIdx, 1);

    return newState;
  }
  case UPDATE_TAB: {
    const { windowID, tabID } = action.payload;
    const windowIdx = state.findIndex((item) => {
      return item.id === windowID;
    });
    if (windowIdx === -1) {
      return state;
    }
    const tabIdx = state[windowIdx].tabs.findIndex((item) => {
      return item.id === tabID;
    });
    if (tabIdx === -1) {
      return state;
    }

    const newState = state.slice();
    newState[windowIdx].tabs[tabIdx].metaDataID = action.payload.metaDataID;
    newState[windowIdx].tabs[tabIdx].content = action.payload.content;

    return newState;
  }
  default: return state;
  }
}
