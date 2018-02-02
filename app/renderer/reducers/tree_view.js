// @flow

import type { BufferItem } from '../../common/project';
// import type { ActionTypes } from './index';

export type TreeViewAction = {
  type: 'REFRESH_TREE_VIEW',
  projects: Array<BufferItem>
};

export type TreeViewPartialUpdateAction = {
  type: 'REFRESH_TREE_VIEW_ITEM',
  projectName: string,
  path: string,
  item: BufferItem
};

export type TreeViewCloseItemAction = {
  type: 'CLOSE_TREE_VIEW_ITEM',
  projectName: string,
  path: string
};

export type TreeViewState = {
  projects: Array<BufferItem>
};

export function initialTreeViewState(): TreeViewState {
  return {
    projects: []
  };
}

export default {};
