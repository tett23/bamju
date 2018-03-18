// @flow

import {
  type Dispatch,
} from 'redux';
import {
  type State,
} from '../reducers/app_window';
import {
  type Meta,
  type Actions,
} from '../reducers/types';
import {
  type MetaDataID
} from '../common/metadata';
import {
  type BrowserState,
} from '../reducers/browser';
import {
  parseMetaData,
} from '../actions/parser';

export type Tab = {
  id: string,
  metaDataID: ?MetaDataID,
  content: string
};

export const INITIALIZE_BROWSER = 'INITIALIZE_BROWSER';
export const ADD_TAB = 'ADD_TAB';
export const CLOSE_TAB = 'CLOSE_TAB';
export const CLOSE_ALL_TABS = 'CLOSE_ALL_TABS';
export const ADD_OR_FOCUS_TAB = 'ADD_OR_FOCUS_TAB';
export const UPDATE_TAB = 'UPDATE_TAB';
export const UPDATE_CURRENT_TAB = 'UPDATE_CURRENT_TAB';
export const ACTIVE_TAB = 'ACTIVE_TAB';

export function initializeBrowser(state: BrowserState, meta: Meta = {}) {
  return {
    type: INITIALIZE_BROWSER,
    payload: {
      state
    },
    meta,
  };
}

export function addTab(metaDataID: ?MetaDataID, content: string, meta: Meta = {}) {
  return {
    type: ADD_TAB,
    payload: {
      id: `${Math.random()}`,
      metaDataID,
      content,
    },
    meta,
  };
}

export function closeTab(id: string, meta: Meta = {}) {
  return {
    type: CLOSE_TAB,
    payload: {
      id,
    },
    meta,
  };
}

export function closeAllTabs(meta: Meta = {}) {
  return {
    type: CLOSE_ALL_TABS,
    payload: {},
    meta,
  };
}

export function addOrActiveTab(metaDataID: MetaDataID, meta: Meta = {}) {
  return (dispatch: Dispatch<Actions>, getState: () => State) => {
    const state = getState();
    const idx = state.browser.tabs.findIndex((item) => {
      return item.metaDataID === metaDataID;
    });
    if (idx === -1) {
      const tab = addTab(metaDataID, '');
      dispatch(tab);
      dispatch(parseMetaData(tab.payload.id, metaDataID));
      return tab;
    }
    dispatch(activeTab(state.browser.tabs[idx].id, meta));
    return state.browser.tabs[idx];
  };
}

export function updateTab(id: string, metaDataID: MetaDataID, content: string, meta: Meta = {}) {
  return {
    type: UPDATE_TAB,
    payload: {
      id,
      metaDataID,
      content,
    },
    meta,
  };
}

export function updateCurrentTab(metaDataID: MetaDataID, content: string, meta: Meta = {}) {
  return {
    type: UPDATE_CURRENT_TAB,
    payload: {
      metaDataID,
      content,
    },
    meta,
  };
}

export function activeTab(id: string, meta: Meta = {}) {
  return {
    type: ACTIVE_TAB,
    payload: {
      id
    },
    meta,
  };
}
