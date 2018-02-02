// @flow

import { combineReducers } from 'redux';
import type { BufferItem } from '../../common/project';
import { deepCopy, deepMerge } from '../../common/util';

import {
  REFRESH_TREE_VIEW,
  REFRESH_TREE_VIEW_ITEM,
  CLOSE_TREE_VIEW_ITEM,
  refreshTreeView,
  closeTreeViewItem,
  openTreeViewItem
} from '../actions/tree_view';
import { OPEN_PAGE, openPageByBuffer } from '../actions/tab';

import { type TreeViewState } from './tree_view';
import { type BrowserState } from './browser';

function initialTreeViewState(): TreeViewState {
  return {
    projects: []
  };
}

function updateBufferItem(source: Array<BufferItem>, projectName: string, path: string, update: BufferItem): Array<BufferItem> {
  const ret = source.map((item) => {
    if (item.projectName === projectName && item.path === path) {
      return update;
    }

    const r = Object.assign({}, item);
    r.items = updateBufferItem(item.items, projectName, path, update);

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
    return Object.assign({}, state, {
      projects: action.projects
    });
  }
  case REFRESH_TREE_VIEW_ITEM: {
    const newProjects = updateBufferItem(deepCopy(state.projects), action.projectName, action.path, action.item);

    return Object.assign({}, state, { projects: newProjects });
  }
  case CLOSE_TREE_VIEW_ITEM: {
    const find:?BufferItem = findBufferItem(state.projects, action.projectName, action.path);
    if (find === null || find === undefined) {
      return state;
    }

    const update:BufferItem = deepMerge(find, {
      isOpened: false,
      items: []
    });

    const newProjects = updateBufferItem(deepCopy(state.projects), action.projectName, action.path, update);
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

type __ReturnType<B, F: (...any) => B> = B;
type $ReturnType<F> = __ReturnType<*, F>;

export type ActionTypes = $ReturnType<typeof openPageByBuffer>
| $ReturnType<typeof refreshTreeView>
| $ReturnType<typeof closeTreeViewItem>
| $ReturnType<typeof openTreeViewItem>;

export const appReducer = combineReducers({
  browser,
  treeView,
});

export default appReducer;
