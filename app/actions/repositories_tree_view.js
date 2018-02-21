// @flow

import {
  type MetaDataID,
} from '../common/metadata';
import {
  type RepositoriesTreeViewState,
} from '../reducers/repositories_tree_view';

export const INITIALIZE_REPOSITORIES_TREE_VIEW = 'REPOSITORIES_TREE_VIEW:INITIALIZE_REPOSITORIES_TREE_VIEW';
export const OPEN_BUFFER = 'REPOSITORIES_TREE_VIEW:OPEN_BUFFER';
export const CLOSE_BUFFER = 'REPOSITORIES_TREE_VIEW:CLOSE_BUFFER';

export function initializeRepositoriesTreeView(state: RepositoriesTreeViewState) {
  return {
    type: INITIALIZE_REPOSITORIES_TREE_VIEW,
    payload: state
  };
}

export function openBuffer(metaDataID: MetaDataID) {
  return {
    type: OPEN_BUFFER,
    payload: {
      metaDataID
    }
  };
}

export function closeBuffer(metaDataID: MetaDataID) {
  return {
    type: CLOSE_BUFFER,
    payload: {
      metaDataID
    }
  };
}
