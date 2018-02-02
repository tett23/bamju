// @flow

import { combineReducers } from 'redux';
import { type BrowserAction } from './browser';
import type { TreeViewAction, TreeViewPartialUpdateAction, TreeViewCloseItemAction } from './tree_view';

import { REFRESH_TREE_VIEW, REFRESH_TREE_VIEW_ITEM, CLOSE_TREE_VIEW_ITEM } from '../actions/tree_view';
import { OPEN_PAGE } from '../actions/tab';
import type { BufferItem } from '../../common/project';

import { type TreeViewState } from './tree_view';
import { type BrowserState } from './browser';
import { deepCopy, deepMerge } from '../../common/util';

function initialTreeViewState(): TreeViewState {
  return {
    projects: []
  };
}

function updateBufferItem(source: Array<BufferItem>, update: BufferItem): Array<BufferItem> {
  const ret = source.map((item) => {
    if (item.projectName === update.projectName && item.path === update.path) {
      return update;
    }

    const r = Object.assign({}, item);
    r.items = updateBufferItem(item.items, update);

    return r;
  });

  return ret;
}

function findBufferItem(projects: Array<BufferItem>, projectName: string, path: string): ?BufferItem {
  let ret:?BufferItem = null;
  projects.some((item) => {
    if (item.projectName === projectName && item.path === path) {
      ret = item;
      return true;
    }

    ret = findBufferItem(item.items, projectName, path);
    if (ret != null) {
      return true;
    }

    return false;
  });

  return ret;
}

export function treeView(state: TreeViewState = initialTreeViewState(), action: ActionTypes): TreeViewState {
  console.log(`reducer mainView ${action.type}`, action, state);

  switch (action.type) {
  case REFRESH_TREE_VIEW: {
    return (Object.assign({}, state, {
      projects: action.projects
    }): TreeViewState);
  }
  case REFRESH_TREE_VIEW_ITEM: {
    const newProjects = updateBufferItem(deepCopy(state.projects), action.item);

    return Object.assign({}, state, { projects: newProjects });
  }
  case CLOSE_TREE_VIEW_ITEM: {
    const find:?BufferItem = findBufferItem(state.projects, action.projectName, action.path);
    if (find === null || find === undefined) {
      return state;
    }

    const update:BufferItem = deepMerge(find, {
      isLoaded: false,
      items: []
    });
    console.log('CLOSE_TREE_VIEW_ITEM update', update);

    const newProjects = updateBufferItem(deepCopy(state.projects), update);
    return Object.assign({}, state, { projects: newProjects });
  }
  default:
    return state;
  }
}

export function initialBrowserState(): BrowserState {
  return {
    tabs: [
      {
        name: '',
        projectName: '',
        path: '',
        absolutePath: '',
        itemType: 'undefined',
        body: ''
      }
    ]
  };
}

export function browser(state: BrowserState = initialBrowserState(), action: ActionTypes): BrowserState {
  console.log(`reducer tabReducer ${action.type}`, action, state);

  switch (action.type) {
  case OPEN_PAGE: {
    return (Object.assign({}, state, {
      tabs: [action.buffer]
    }): BrowserState);
  }
  default:
    return state;
  }
}

export type ActionTypes = BrowserAction | TreeViewAction | TreeViewPartialUpdateAction | TreeViewCloseItemAction | {type: string};

export const appReducer = combineReducers({
  browser,
  treeView,
});

export default appReducer;
