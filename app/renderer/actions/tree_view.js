// @flow

import {
  type Buffer
} from '../../common/buffer';

export const REFRESH_TREE_VIEW = 'REFRESH_TREE_VIEW';
export const UPDATE_BUFFER = 'UPDATE_BUFFER';

export type page = {
  body: string
};

export function refreshTreeView(repositories: {[string]: Buffer[]}) {
  return {
    type: REFRESH_TREE_VIEW,
    repositories
  };
}

export function updateBuffer(buffer: Buffer) {
  return {
    type: UPDATE_BUFFER,
    buffer,
  };
}
