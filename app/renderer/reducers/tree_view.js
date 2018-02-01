// @flow

import { REFRESH_TREE_VIEW, REFRESH_TREE_VIEW_ITEM } from '../actions/tree_view';
import type { BufferItem } from '../../common/project';
import type { ActionTypes } from './index';

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

export type TreeViewState = {
  projects: Array<BufferItem>
};

export function initialTreeViewState(): TreeViewState {
  return {
    projects: []
  };
}

function updateProjectItem(item: BufferItem, path: string, update: BufferItem) {
  if (item.path === path) {
    item.items = update.items;
    return;
  }

  item.items.forEach((_, i: number) => {
    updateProjectItem(item.items[i], path, update);
  });
}

function defaultAction(): {type: string} {
  return { type: '' };
}

export function treeView(state: TreeViewState = initialTreeViewState(), action: ActionTypes = defaultAction()): TreeViewState {
  console.log(`reducer mainView ${action.type}`, action, state);

  switch (action.type) {
  case REFRESH_TREE_VIEW: {
    return (Object.assign({}, state, {
      projects: action.projects
    }): TreeViewState);
  }
  case REFRESH_TREE_VIEW_ITEM: {
    const idx = state.projects.findIndex((p) => {
      return p.name === action.projectName;
    });

    const project:?BufferItem = state.projects[idx];
    if (project == null) {
      return state;
    }

    const newState:TreeViewState = Object.assign({}, state);
    const { path, item: update } = action;
    newState.projects[idx].items.forEach((_, i: number) => {
      updateProjectItem(newState.projects[idx].items[i], path, update);
    });

    console.log('reducer REFRESH_TREE_VIEW_ITEM', newState);

    const o = state.projects;
    const n = newState.projects;
    const newProjects = Object.assign([], o, n);
    return (Object.assign({}, state, {
      projects: newProjects
    }): TreeViewState);
  }
  default:
    return state;
  }
}

export default treeView;
