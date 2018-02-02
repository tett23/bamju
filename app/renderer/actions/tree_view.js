// @flow

import type { BufferItem } from '../../common/project';

export const REFRESH_TREE_VIEW = 'REFRESH_TREE_VIEW';
export const REFRESH_TREE_VIEW_ITEM = 'REFRESH_TREE_VIEW_ITEM';
export const CLOSE_TREE_VIEW_ITEM = 'CLOSE_TREE_VIEW_ITEM';

export type page = {
  body: string
};

export function refreshTreeView(p: Array<BufferItem>) {
  return {
    type: REFRESH_TREE_VIEW,
    projects: p
  };
}

export function closeTreeViewItem(projectName: string, path: string) {
  return {
    type: CLOSE_TREE_VIEW_ITEM,
    projectName,
    path,
  };
}

export function openTreeViewItem(projectName: string, path: string, update: BufferItem) {
  return {
    type: REFRESH_TREE_VIEW_ITEM,
    projectName,
    path,
    item: update
  };
}
