// @flow

import {
  type MetaDataID
} from '../common/metadata';

export const ADD_TAB = 'ADD_TAB';
export const CLOSE_TAB = 'CLOSE_TAB';
export const UPDATE_TAB = 'UPDATE_TAB';

export function addTab(metaDataID: MetaDataID, content: string) {
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
