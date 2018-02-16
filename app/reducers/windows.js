// @flow

import {
  type ActionTypes,
} from './combined';
import {
  type Rectangle,
  type Tab,
  INITIALIZE_WINDOWS,
  NEW_WINDOW,
  CLOSE_WINDOW,
  UPDATE_WINDOW_RECTANGLE,
  ADD_TAB,
  CLOSE_TAB,
  UPDATE_TAB,
} from '../actions/windows';
import {
  type WindowID,
} from '../common/window';

export type WindowsState = Array<{
  id: WindowID,
  rectangle: Rectangle,
  tabs: Tab[]
}>;

export function initialWindowsState() {
  return [];
}

export function windows(state: WindowsState = initialWindowsState(), action: ActionTypes): WindowsState {
  switch (action.type) {
  case INITIALIZE_WINDOWS: {
    return action.state;
  }
  case NEW_WINDOW: {
    const newState = state.slice();
    newState.push({
      id: action.windowID,
      rectangle: action.rectangle,
      tabs: action.tabs,
    });

    return newState;
  }
  case CLOSE_WINDOW: {
    const idx = state.findIndex((item) => {
      return item.id === action.windowID;
    });
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
    newState.splice(idx, 1);

    return newState;
  }
  case UPDATE_WINDOW_RECTANGLE: {
    const idx = state.findIndex((item) => {
      return item.id === action.windowID;
    });
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
    newState[idx].rectangle = action.rectangle;

    return newState;
  }
  case ADD_TAB: {
    const idx = state.findIndex((item) => {
      return item.id === action.windowID;
    });
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
    newState[idx].tabs.push({
      id: action.tabID,
      metaDataID: action.metaDataID,
      content: action.content,
    });

    return newState;
  }
  case CLOSE_TAB: {
    const windowIdx = state.findIndex((item) => {
      return item.id === action.windowID;
    });
    if (windowIdx === -1) {
      return state;
    }
    const tabIdx = state[windowIdx].tabs.findIndex((item) => {
      return item.id === action.tabID;
    });
    if (tabIdx === -1) {
      return state;
    }

    const newState = state.slice();
    newState[windowIdx].tabs.splice(tabIdx, 1);

    return newState;
  }
  case UPDATE_TAB: {
    const windowIdx = state.findIndex((item) => {
      return item.id === action.windowID;
    });
    if (windowIdx === -1) {
      return state;
    }
    const tabIdx = state[windowIdx].tabs.findIndex((item) => {
      return item.id === action.tabID;
    });
    if (tabIdx === -1) {
      return state;
    }

    const newState = state.slice();
    newState[windowIdx].tabs[tabIdx].metaDataID = action.metaDataID;
    newState[windowIdx].tabs[tabIdx].content = action.content;

    return newState;
  }
  default: return state;
  }
}
