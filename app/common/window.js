// @flow

import {
  BrowserWindow,
} from 'electron';
import {
  type MenuType,
} from '../menu';

export interface Window {
  windowID(): string;
  focus(): void;
  getBrowserWindow(): BrowserWindow;
  getType(): MenuType
}


export function createWindowID(): string {
  const timestamp:number = new Date().getTime();

  return `${timestamp}${Math.random()}`;
}

export default {};
