// @flow

import {
  type Buffer
} from '../../common/buffer';

export const OPEN_BUFFER = 'OPEN_BUFFER';
export const BURFFER_UPDATED = 'BUFFER_UPDATED';

export function openBuffer(buffer: Buffer, content: string) {
  return {
    type: OPEN_BUFFER,
    buffer,
    content
  };
}

export function bufferUpdated(buffer: Buffer, content: string) {
  return {
    type: BURFFER_UPDATED,
    buffer,
    content
  };
}
