// @flow

export const REFRESH_TREE_VIEW = 'REFRESH_TREE_VIEW';

export type page = {
  body: string
};

export function refreshTreeView(p) {
  return {
    type: REFRESH_TREE_VIEW,
    projects: p
  };
}
