// @flow

import {
  type Buffer
} from '../common/buffer';
import {
  type MetaDataID,
} from '../common/metadata';

export const RELOAD_REPOSITORIES = Symbol('RELOAD_REPOSITORIES');
export const UPDATE_BUFFERS = Symbol('UPDATE_BUFFERS');

export type BufferUpdate = {
  removes?: MetaDataID[],
  additions?: Buffer[],
  changes?: Buffer[]
};

export function reloadRepositories(buffers: Buffer[]) {
  return {
    type: RELOAD_REPOSITORIES,
    buffers
  };
}

export function updateBuffers(updates: BufferUpdate) {
  return {
    type: UPDATE_BUFFERS,
    updates,
  };
}
