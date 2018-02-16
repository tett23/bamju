// @flow

import {
  type MetaDataID
} from '../common/metadata';
import {
  type WindowID,
  createWindowID,
} from '../common/window';

export const NEW_WINDOW = Symbol('NEW_WINDOW');
export const CLOSE_WINDOW = Symbol('CLOSE_WINDOW');
export const ADD_TAB = Symbol('ADD_TAB');
export const CLOSE_TAB = Symbol('CLOSE_TAB');
export const UPDATE_TAB = Symbol('UPDATE_TAB');

export function newWindow() {
  return {
    type: NEW_WINDOW,
    windowID: createWindowID()
  };
}

export function closeWindow(windowID: string) {
  return {
    type: CLOSE_WINDOW,
    windowID
  };
}

export function addTab(windowID: WindowID, metaDataID: MetaDataID, content: string) {
  return {
    type: ADD_TAB,
    windowID,
    tabID: `${Math.random()}`,
    metaDataID,
    content,
  };
}

export function closeTab(windowID: WindowID, tabID: string) {
  return {
    type: CLOSE_TAB,
    windowID,
    tabID,
  };
}

export function updateTab(windowID: WindowID, tabID: string, metaDataID: MetaDataID, content: string) {
  return {
    type: UPDATE_TAB,
    windowID,
    tabID,
    metaDataID,
    content,
  };
}
