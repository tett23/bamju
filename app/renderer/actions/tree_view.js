// @flow

import type { Projects } from '../../common/project';

export const REFRESH_TREE_VIEW = 'REFRESH_TREE_VIEW';

export type page = {
  body: string
};

export function refreshTreeView(p: Projects) {
  return {
    type: REFRESH_TREE_VIEW,
    projects: p
  };
}
