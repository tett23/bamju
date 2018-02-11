// @flow

import {
  BrowserWindow,
} from 'electron';
import {
  type MenuType,
} from '../menu';
import {
  type Buffer,
} from './buffer';

export type WindowID = string;

export interface Window {
  windowID(): WindowID;
  focus(): void;
  getBrowserWindow(): BrowserWindow;
  getType(): MenuType
}

export type WindowConfig = {
  id: string,
  rectangle: {
    x: number,
    y: number,
    width: number,
    height: number
  },
  tabs: Array<{
    buffer: Buffer,
    content: string
  }>
};

export function createWindowID(): WindowID {
  const timestamp:number = new Date().getTime();

  return `${timestamp}${Math.random()}`;
}

export default {};
