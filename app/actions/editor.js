// @flow

import { type Meta } from '../reducers/types';
import {
  type Buffer
} from '../common/buffer';

export const OPEN_BUFFER = 'OPEN_BUFFER';
export const BURFFER_UPDATED = 'BUFFER_UPDATED';
export const BUFFER_SAVED = 'BUFFER_SAVED';

export function openBuffer(buffer: Buffer, content: string, meta: Meta = {}) {
  return {
    type: OPEN_BUFFER,
    payload: {
      buffer,
      content
    },
    meta
  };
}

export function bufferUpdated(buffer: Buffer, content: string, meta: Meta = {}) {
  return {
    type: BURFFER_UPDATED,
    payload: {
      buffer,
      content
    },
    meta
  };
}

export function bufferSaved(meta: Meta = {}) {
  return {
    type: BUFFER_SAVED,
    payload: {},
    meta
  };
}
