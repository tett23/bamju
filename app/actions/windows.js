// @flow

import { type Meta } from '../reducers/types';
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
  type Tab,
} from './browser';

export const INITIALIZE_WINDOWS = 'INITIALIZE_WINDOWS';
export const WINDOW_INITIALIZED = 'WINDOW_INITIALIZED';
export const NEW_WINDOW = 'NEW_WINDOW';
export const CLOSE_WINDOW = 'CLOSE_WINDOW';
export const UPDATE_WINDOW_RECTANGLE = 'UPDATE_WINDOW_RECTANGLE';
export const NEW_EDITOR_WINDOW = 'NEW_EDITOR_WINDOW';

export type Rectangle = {
  x: number,
  y: number,
  width: number,
  height: number
};

const rectangleDefault = {
  x: 100,
  y: 100,
  width: 1024,
  height: 728
};

export function initializeWindows(state: WindowsState, meta: Meta = {}) {
  return {
    type: INITIALIZE_WINDOWS,
    payload: {
      state
    },
    meta
  };
}

export function windowInitialized(windowID: WindowID, meta: Meta = {}) {
  return {
    type: WINDOW_INITIALIZED,
    payload: {
      windowID,
    },
    meta
  };
}

export function newWindow(rectangle?: Rectangle = rectangleDefault, tabs?: Tab[] = [], meta: Meta = {}) {
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

export function closeWindow(windowID: string, meta: Meta = {}) {
  return {
    type: CLOSE_WINDOW,
    payload: {
      windowID
    },
    meta
  };
}

export function updateWindowRectangle(windowID: WindowID, rectangle: Rectangle, meta: Meta = {}) {
  return {
    type: UPDATE_WINDOW_RECTANGLE,
    payload: {
      windowID,
      rectangle
    },
    meta
  };
}

export function newEditorWindow(metaDataID: MetaDataID, meta: Meta = {}) {
  return {
    type: NEW_EDITOR_WINDOW,
    payload: {
      windowID: createWindowID(),
      metaDataID,
    },
    meta
  };
}
