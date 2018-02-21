// @flow

import { type Meta } from '../reducers/types';
import {
  type Buffer
} from '../common/buffer';
import {
  type MetaDataID,
} from '../common/metadata';

export const RELOAD_BUFFERS = 'RELOAD_BUFFERS';
export const UPDATE_BUFFERS = 'UPDATE_BUFFERS';

export type BufferUpdate = {
  removes?: MetaDataID[],
  additions?: Buffer[],
  changes?: Buffer[]
};

export function reloadBuffers(buffers: Buffer[], meta: Meta = {}) {
  return {
    type: RELOAD_BUFFERS,
    payload: {
      buffers
    },
    meta
  };
}

export function updateBuffers(updates: BufferUpdate, meta: Meta = {}) {
  return {
    type: UPDATE_BUFFERS,
    payload: {
      updates,
    },
    meta
  };
}
