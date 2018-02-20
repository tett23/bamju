// @flow

import {
  type Actions
} from './app_window';
import {
  ADD_TAB,
  CLOSE_TAB,
  UPDATE_TAB,
  addTab,
} from '../actions/browser';

import {
  type MetaDataID
} from '../common/metadata';

import {
  deepCopy,
} from '../common/util';

export type BrowserState = {
  tabs: Array<{id: string, metaDataID: ?MetaDataID, content: string}>
};

export function initialBrowserState(): BrowserState {
  return {
    tabs: [addTab('', 'empty buffer').payload]
  };
}

export function browser(state: BrowserState = initialBrowserState(), action: Actions): BrowserState {
  switch (action.type) {
  case ADD_TAB: {
    const newState = deepCopy(state);
    newState.tabs.push({
      id: action.payload.id,
      metaDataID: action.payload.metaDataID,
      content: action.payload.content,
    });

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
      newState.tabs.push(addTab(null, 'empty buffer').payload);
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
  default:
    return state;
  }
}
