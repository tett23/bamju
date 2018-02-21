// @flow

import { type Meta } from '../reducers/types';
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
