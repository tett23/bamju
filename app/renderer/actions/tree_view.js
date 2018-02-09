// @flow

import {
  type Buffer
} from '../../common/buffer';

export const REFRESH_TREE_VIEW = 'REFRESH_TREE_VIEW';
export const REFRESH_TREE_VIEW_ITEM = 'REFRESH_TREE_VIEW_ITEM';

export type page = {
  body: string
};

export function refreshTreeView(repositories: {[string]: Buffer[]}) {
  return {
    type: REFRESH_TREE_VIEW,
    repositories
  };
}

export function openTreeViewItem(projectName: string, path: string, update: Buffer) {
  return {
    type: REFRESH_TREE_VIEW_ITEM,
    projectName,
    path,
    item: update
  };
}
