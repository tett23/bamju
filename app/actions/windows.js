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

export const INITIALIZE_WINDOWS = 'INITIALIZE_WINDOWS';
export const NEW_WINDOW = 'NEW_WINDOW';
export const CLOSE_WINDOW = 'CLOSE_WINDOW';
export const UPDATE_WINDOW_RECTANGLE = 'UPDATE_WINDOW_RECTANGLE';

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
    payload: {
      state
    }
  };
}

export function newWindow(rectangle?: Rectangle = rectangleDefault, tabs?: Tab[] = []) {
  return {
    type: NEW_WINDOW,
    payload: {
      windowID: createWindowID(),
      rectangle,
      tabs,
    }
  };
}

export function closeWindow(windowID: string) {
  return {
    type: CLOSE_WINDOW,
    payload: {
      windowID
    }
  };
}

export function updateWindowRectangle(windowID: WindowID, rectangle: Rectangle) {
  return {
    type: UPDATE_WINDOW_RECTANGLE,
    payload: {
      windowID,
      rectangle
    }
  };
}
