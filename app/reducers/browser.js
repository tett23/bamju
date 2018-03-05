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
  ACTIVE_TAB,
  addTab,
} from '../actions/browser';
import {
  BUFFER_CONTEND_UPDATED,
} from '../actions/buffers';

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
    const newState = deepCopy(action.payload.state);
    if (newState.tabs.length === 0) {
      const tab = addTab(null, '');
      newState.tabs = [tab.payload];
      newState.currentTabID = tab.payload.id;
    }

    return newState;
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
    }

    if (newState.currentTabID === action.payload.id) {
      const newIdx = tabIdx === 0 ? 0 : tabIdx - 1;
      newState.currentTabID = newState.tabs[newIdx].id;
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
  case BUFFER_CONTEND_UPDATED: {
    const isUpdate = state.tabs.some((item) => {
      return item.metaDataID === action.payload.metaDataID;
    });
    if (!isUpdate) {
      return state;
    }

    const newState = deepCopy(state);
    newState.tabs.forEach((_, i) => {
      if (newState.tabs[i].metaDataID === action.payload.metaDataID) {
        newState.tabs[i].content = action.payload.content;
      }
    });

    return newState;
  }
  case ACTIVE_TAB: {
    const idx = state.tabs.findIndex((item) => {
      return item.id === action.payload.id;
    });
    if (idx === -1) {
      return state;
    }

    const newState = deepCopy(state);
    newState.currentTabID = action.payload.id;

    return newState;
  }
  default:
    return state;
  }
}
