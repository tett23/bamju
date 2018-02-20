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
export const ADD_TAB = 'ADD_TAB';
export const CLOSE_TAB = 'CLOSE_TAB';
export const UPDATE_TAB = 'UPDATE_TAB';

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

export function addTab(windowID: WindowID, metaDataID: MetaDataID, content: string) {
  return {
    type: ADD_TAB,
    payload: {
      windowID,
      tabID: `${Math.random()}`,
      metaDataID,
      content,
    }
  };
}

export function closeTab(windowID: WindowID, tabID: string) {
  return {
    type: CLOSE_TAB,
    payload: {
      windowID,
      tabID,
    }
  };
}

export function updateTab(windowID: WindowID, tabID: string, metaDataID: MetaDataID, content: string) {
  return {
    type: UPDATE_TAB,
    payload: {
      windowID,
      tabID,
      metaDataID,
      content,
    }
  };
}
