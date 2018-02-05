// @flow

import type { Buffer } from '../../common/project';

export const OPEN_PAGE = 'OPEN_PAGE';
export const BUFFER_UPDATED = 'BUFFER_UPDATED';

export type page = {
  body: string
};

export function openPageByBuffer(buf: Buffer) {
  return {
    type: OPEN_PAGE,
    buffer: buf
  };
}

export function bufferUpdated(buf: Buffer) {
  return {
    type: BUFFER_UPDATED,
    buffer: buf
  };
}
