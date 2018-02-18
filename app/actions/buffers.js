// @flow

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

export function reloadBuffers(buffers: Buffer[]) {
  return {
    type: RELOAD_BUFFERS,
    buffers
  };
}

export function updateBuffers(updates: BufferUpdate) {
  return {
    type: UPDATE_BUFFERS,
    updates,
  };
}
