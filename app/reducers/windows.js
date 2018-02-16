// @flow

import {
  type ActionTypes,
} from './combined';
import {
  NEW_WINDOW,
  CLOSE_WINDOW,
  ADD_TAB,
  CLOSE_TAB,
  UPDATE_TAB,
} from '../actions/windows';
import {
  type MetaDataID,
} from '../common/metadata';
import {
  type WindowID,
} from '../common/window';

export type Tab = {
  id: string,
  metaDataID: MetaDataID,
  content: string
};

export type WindowsState = Array<{
  id: WindowID,
  tabs: Tab[]
}>;

export function initialWindowsState() {
  return [];
}

export function windows(state: WindowsState = initialWindowsState(), action: ActionTypes): WindowsState {
  switch (action.type) {
  case NEW_WINDOW: {
    const newState = state.slice();
    newState.push({
      id: action.windowID,
      tabs: []
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
