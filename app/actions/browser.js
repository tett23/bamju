// @flow

import {
  type MetaDataID
} from '../common/metadata';
import {
  type BrowserState,
} from '../reducers/browser';

export const INITIALIZE_BROWSER = 'INITIALIZE_BROWSER';
export const ADD_TAB = 'ADD_TAB';
export const CLOSE_TAB = 'CLOSE_TAB';
export const UPDATE_TAB = 'UPDATE_TAB';
export const UPDATE_CURRENT_TAB = 'UPDATE_CURRENT_TAB';

export function initializeBrowser(state: BrowserState) {
  return {
    type: INITIALIZE_BROWSER,
    payload: {
      state
    }
  };
}

export function addTab(metaDataID: ?MetaDataID, content: string) {
  return {
    type: ADD_TAB,
    payload: {
      id: `${Math.random()}`,
      metaDataID,
      content,
    }
  };
}

export function closeTab(id: string) {
  return {
    type: CLOSE_TAB,
    payload: {
      id,
    }
  };
}

export function updateTab(id: string, metaDataID: MetaDataID, content: string) {
  return {
    type: UPDATE_TAB,
    payload: {
      id,
      metaDataID,
      content,
    }
  };
}

export function updateCurrentTab(metaDataID: MetaDataID, content: string) {
  return {
    type: UPDATE_CURRENT_TAB,
    payload: {
      metaDataID,
      content,
    }
  };
}
