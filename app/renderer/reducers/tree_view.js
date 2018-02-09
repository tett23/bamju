// @flow

import {
  type ActionTypes
} from './combined';
import {
  REFRESH_TREE_VIEW,
  UPDATE_BUFFER,
} from '../actions/tree_view';

import {
  deepCopy,
} from '../../common/util';

import type { Buffer } from '../../common/buffer';
// import type { ActionTypes } from './index';

export type TreeViewState = {
  repositories: {
    [string]: Buffer[]
  }
};

export function initialTreeViewState(): TreeViewState {
  return {
    repositories: {}
  };
}

function updateBufferItem(source: {[string]: Buffer[]}, update: Buffer): {[string]: Buffer[]} {
  const repo = source[update.repositoryName];
  const newItems = repo.map((item) => {
    if (item.path === update.path) {
      return update;
    }

    return item;
  });

  const ret = deepCopy(source);
  ret[update.repositoryName] = deepCopy(newItems);

  return ret;
}

export function treeView(state: TreeViewState = initialTreeViewState(), action: ActionTypes): TreeViewState {
  console.log(`reducer mainView ${action.type}`, action, state);

  switch (action.type) {
  case REFRESH_TREE_VIEW: {
    return Object.assign({}, state, {
      repositories: action.repositories
    });
  }
  case UPDATE_BUFFER: {
    const newRepositories = updateBufferItem(deepCopy(state.repositories), action.buffer);

    return Object.assign({}, state, { repositories: newRepositories });
  }
  default:
    return state;
  }
}
