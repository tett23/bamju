// @flow

import {
  type Buffer
} from '../../common/buffer';

export const OPEN_PAGE = 'OPEN_PAGE';
export const BUFFER_UPDATED = 'BUFFER_UPDATED';

export type page = {
  body: string
};

export function openPageByBuffer(buf: Buffer, content: string) {
  return {
    type: OPEN_PAGE,
    buffer: buf,
    content,
  };
}

export function bufferUpdated(buf: Buffer, content: string) {
  return {
    type: BUFFER_UPDATED,
    buffer: buf,
    content,
  };
}
