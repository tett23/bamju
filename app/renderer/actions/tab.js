// @flow

import type { Buffer } from '../../common/project';
import type { BrowserAction } from '../reducers/browser';

export const OPEN_PAGE = 'OPEN_PAGE';

export type page = {
  body: string
};

export function openPageByBuffer(buf: Buffer): BrowserAction {
  return {
    type: OPEN_PAGE,
    buffer: buf
  };
}
