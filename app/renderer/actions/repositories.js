// @flow

import {
  type Buffer
} from '../../common/buffer';

export const RELOAD_REPOSITORIES = 'RELOAD_REPOSITORIES';
export const UPDATE_BUFFERS = 'UPDATE_BUFFERS';
export const ADD_BUFFERS = 'ADD_BUFFERS';
export const REMOVE_BUFFERS = 'REMOVE_BUFFERS';

export function reloadRepositories(repositories: {[string]: Buffer[]}) {
  return {
    type: RELOAD_REPOSITORIES,
    repositories
  };
}

export function updateBuffers(buffers: Buffer[]) {
  return {
    type: UPDATE_BUFFERS,
    buffers,
  };
}

export function addBuffers(buffers: Buffer[]) {
  return {
    type: ADD_BUFFERS,
    buffers,
  };
}

export function removeBuffers(buffers: Buffer[]) {
  return {
    type: REMOVE_BUFFERS,
    buffers,
  };
}
