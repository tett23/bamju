// @flow

import type { Projects, ProjectItem } from '../../common/project';
import type { ActionType } from '../reducers/main_view';

export const REFRESH_TREE_VIEW = 'REFRESH_TREE_VIEW';
export const REFRESH_TREE_VIEW_ITEM = 'REFRESH_TREE_VIEW_ITEM';

export type page = {
  body: string
};

export function refreshTreeView(p: Projects): ActionType {
  return {
    type: REFRESH_TREE_VIEW,
    projects: p
  };
}

export function refreshTreeViewItem(projectName: string, path: string, update: ProjectItem): ActionType {
  return {
    type: REFRESH_TREE_VIEW_ITEM,
    projectName,
    path,
    item: update
  };
}
