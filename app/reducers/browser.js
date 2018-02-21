// @flow

import {
  type Actions
} from './types';
import {
  INITIALIZE_BROWSER,
  ADD_TAB,
  CLOSE_TAB,
  UPDATE_TAB,
  UPDATE_CURRENT_TAB,
  addTab,
} from '../actions/browser';

import {
  type MetaDataID
} from '../common/metadata';

import {
  deepCopy,
} from '../common/util';

export type BrowserState = {
  currentTabID: string,
  tabs: Array<{id: string, metaDataID: ?MetaDataID, content: string}>
};

export function initialBrowserState(): BrowserState {
  const tab = addTab(null, 'empty buffer').payload;

  return {
    currentTabID: tab.id,
    tabs: [tab]
  };
}

export function browser(state: BrowserState = initialBrowserState(), action: Actions): BrowserState {
  switch (action.type) {
  case INITIALIZE_BROWSER: {
    return action.payload.state;
  }
  case ADD_TAB: {
    const newState = deepCopy(state);
    newState.tabs.push({
      id: action.payload.id,
      metaDataID: action.payload.metaDataID,
      content: action.payload.content,
    });
    newState.currentTabID = action.payload.id;

    return newState;
  }
  case CLOSE_TAB: {
    const id = action.payload.id;
    const tabIdx = state.tabs.findIndex((item) => {
      return item.id === id;
    });
    if (tabIdx === -1) {
      return state;
    }

    const newState = deepCopy(state);
    newState.tabs.splice(tabIdx, 1);

    if (newState.tabs.length === 0) {
      const tab = addTab(null, 'empty buffer').payload;
      newState.tabs.push(tab);
      newState.currentTabID = tab.id;
    }

    return newState;
  }
  case UPDATE_TAB: {
    const id = action.payload.id;
    const tabIdx = state.tabs.findIndex((item) => {
      return item.id === id;
    });
    if (tabIdx === -1) {
      return state;
    }

    const newState = deepCopy(state);
    newState.tabs[tabIdx].metaDataID = action.payload.metaDataID;
    newState.tabs[tabIdx].content = action.payload.content;

    return newState;
  }
  case UPDATE_CURRENT_TAB: {
    const tabIdx = state.tabs.findIndex((item) => {
      return item.id === state.currentTabID;
    });
    if (tabIdx === -1) {
      return state;
    }

    const newState = deepCopy(state);
    newState.tabs[tabIdx].metaDataID = action.payload.metaDataID;
    newState.tabs[tabIdx].content = action.payload.content;

    return newState;
  }
  default:
    return state;
  }
}
