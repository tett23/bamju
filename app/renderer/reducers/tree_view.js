// @flow

import type { BufferItem } from '../../common/project';
// import type { ActionTypes } from './index';

export type TreeViewState = {
  projects: Array<BufferItem>
};

export function initialTreeViewState(): TreeViewState {
  return {
    projects: []
  };
}

export default {};
