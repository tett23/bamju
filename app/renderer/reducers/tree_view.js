// @flow

import type { Buffer } from '../../common/buffer';
// import type { ActionTypes } from './index';

export type TreeViewState = {
  repositories: {
    [string]: Buffer[]
  }
};

export function initialTreeViewState(): TreeViewState {
  return {
    repositories: {}
  };
}

export default {};
