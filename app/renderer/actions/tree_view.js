
import type { BufferItem } from '../../common/project';
import type { TreeViewAction, TreeViewPartialUpdateAction } from '../reducers/tree_view';

export const REFRESH_TREE_VIEW = 'REFRESH_TREE_VIEW';
export const REFRESH_TREE_VIEW_ITEM = 'REFRESH_TREE_VIEW_ITEM';

export type page = {
  body: string
};

export function refreshTreeView(p: Array<BufferItem>): TreeViewAction {
  return {
    type: REFRESH_TREE_VIEW,
    projects: p
  };
}

export function refreshTreeViewItem(projectName: string, path: string, update: BufferItem): TreeViewPartialUpdateAction {
  return {
    type: REFRESH_TREE_VIEW_ITEM,
    projectName,
    path,
    item: update
  };
}
