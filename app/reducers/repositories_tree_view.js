// @flow

import {
  type Actions
} from './app_window';
import {
  type MetaDataID,
} from '../common/metadata';
import {
  INITIALIZE_REPOSITORIES_TREE_VIEW,
  OPEN_BUFFER,
  CLOSE_BUFFER,
} from '../actions/repositories_tree_view';

export type RepositoriesTreeViewState = {
  [MetaDataID]: {
    isOpened: boolean
  }
};

export function initialRepositoriesTreeViewState() {
  return {};
}

export function repositoriesTreeView(
  state: RepositoriesTreeViewState = initialRepositoriesTreeViewState(),
  action: Actions
): RepositoriesTreeViewState {
  switch (action.type) {
  case INITIALIZE_REPOSITORIES_TREE_VIEW: {
    return action.payload;
  }
  case OPEN_BUFFER: {
    const metaDataID = action.payload.metaDataID;
    const current = state[metaDataID];
    if (current != null && current.isOpened) {
      return state;
    }

    const newState = Object.assign({}, state);
    newState[metaDataID] = Object.assign({}, newState[metaDataID], {
      isOpened: true
    });

    return newState;
  }
  case CLOSE_BUFFER: {
    const metaDataID = action.payload.metaDataID;
    const current = state[metaDataID];
    if (current != null && !current.isOpened) {
      return state;
    }

    const newState = Object.assign({}, state);
    delete newState[metaDataID];

    return newState;
  }
  default:
    return state;
  }
}

export default repositoriesTreeView;
