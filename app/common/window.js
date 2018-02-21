// @flow

import {
  BrowserWindow,
} from 'electron';
import {
  type MenuType,
} from '../menu';

export type WindowID = string;

export interface Window {
  windowID(): WindowID;
  focus(): void;
  getBrowserWindow(): BrowserWindow;
  getType(): MenuType
}

export function createWindowID(): WindowID {
  const timestamp:number = new Date().getTime();

  return `${timestamp}${Math.random()}`;
}

export default {};
