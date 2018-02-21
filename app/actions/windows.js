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
import {
  type BrowserState
} from '../reducers/browser';

export const INITIALIZE_WINDOWS = 'INITIALIZE_WINDOWS';
export const WINDOW_INITIALIZED = 'WINDOW_INITIALIZED';
export const NEW_WINDOW = 'NEW_WINDOW';
export const CLOSE_WINDOW = 'CLOSE_WINDOW';
export const UPDATE_WINDOW_RECTANGLE = 'UPDATE_WINDOW_RECTANGLE';

export type Window = {
  id: WindowID,
  rectangle: Rectangle,
  browser: BrowserState
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

export function initializeWindows(state: WindowsState, meta: Object = {}) {
  return {
    type: INITIALIZE_WINDOWS,
    payload: {
      state
    },
    meta
  };
}

export function windowInitialized(windowID: WindowID, meta: Object = {}) {
  return {
    type: WINDOW_INITIALIZED,
    payload: {
      windowID,
    },
    meta
  };
}

export function newWindow(rectangle?: Rectangle = rectangleDefault, tabs?: Tab[] = [], meta: Object = {}) {
  return {
    type: NEW_WINDOW,
    payload: {
      windowID: createWindowID(),
      rectangle,
      tabs,
    },
    meta
  };
}

export function closeWindow(windowID: string, meta: Object = {}) {
  return {
    type: CLOSE_WINDOW,
    payload: {
      windowID
    },
    meta
  };
}

export function updateWindowRectangle(windowID: WindowID, rectangle: Rectangle, meta: Object = {}) {
  return {
    type: UPDATE_WINDOW_RECTANGLE,
    payload: {
      windowID,
      rectangle
    },
    meta
  };
}
