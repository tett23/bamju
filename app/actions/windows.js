// @flow

import {
  type MetaDataID
} from '../common/metadata';
import {
  type WindowID,
  createWindowID,
} from '../common/window';
import {
  type WindowsState
} from '../reducers/windows';

export const INITIALIZE_WINDOWS = Symbol('INITIALIZE_WINDOWS');
export const NEW_WINDOW = Symbol('NEW_WINDOW');
export const CLOSE_WINDOW = Symbol('CLOSE_WINDOW');
export const UPDATE_WINDOW_RECTANGLE = Symbol('UPDATE_WINDOW_RECTANGLE');
export const ADD_TAB = Symbol('ADD_TAB');
export const CLOSE_TAB = Symbol('CLOSE_TAB');
export const UPDATE_TAB = Symbol('UPDATE_TAB');

export type Window = {
  id: WindowID,
  rectangle: Rectangle,
  tabs: Tab[]
};

export type Rectangle = {
  x: number,
  y: number,
  width: number,
  height: number
};

export type Tab = {
  id: string,
  metaDataID: MetaDataID,
  content: string
};

const rectangleDefault = {
  x: 100,
  y: 100,
  width: 1024,
  height: 728
};

export function initializeWindows(state: WindowsState) {
  return {
    type: INITIALIZE_WINDOWS,
    state
  };
}

export function newWindow(rectangle?: Rectangle = rectangleDefault, tabs?: Tab[] = []) {
  return {
    type: NEW_WINDOW,
    windowID: createWindowID(),
    rectangle,
    tabs,
  };
}

export function closeWindow(windowID: string) {
  return {
    type: CLOSE_WINDOW,
    windowID
  };
}

export function updateWindowRectangle(windowID: WindowID, rectangle: Rectangle) {
  return {
    type: UPDATE_WINDOW_RECTANGLE,
    windowID,
    rectangle
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
