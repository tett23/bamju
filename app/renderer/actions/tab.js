// @flow

import {
  type Buffer
} from '../../common/buffer';

export const OPEN_BUFFER = 'OPEN_BUFFER';
export const BUFFER_UPDATED = 'BUFFER_UPDATED';

export type page = {
  body: string
};

export function openBuffer(buf: Buffer, content: string) {
  return {
    type: OPEN_BUFFER,
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
