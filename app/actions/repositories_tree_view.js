// @flow

import { type Meta } from '../reducers/types';
import {
  type MetaDataID,
} from '../common/metadata';
import {
  type RepositoriesTreeViewState,
} from '../reducers/repositories_tree_view';

export const INITIALIZE_REPOSITORIES_TREE_VIEW = 'REPOSITORIES_TREE_VIEW:INITIALIZE_REPOSITORIES_TREE_VIEW';
export const OPEN_BUFFER = 'REPOSITORIES_TREE_VIEW:OPEN_BUFFER';
export const CLOSE_BUFFER = 'REPOSITORIES_TREE_VIEW:CLOSE_BUFFER';

export function initializeRepositoriesTreeView(state: RepositoriesTreeViewState, meta: Meta = {}) {
  return {
    type: INITIALIZE_REPOSITORIES_TREE_VIEW,
    payload: state,
    meta
  };
}

export function openBuffer(metaDataID: MetaDataID, meta: Meta = {}) {
  return {
    type: OPEN_BUFFER,
    payload: {
      metaDataID
    },
    meta
  };
}

export function closeBuffer(metaDataID: MetaDataID, meta: Meta = {}) {
  return {
    type: CLOSE_BUFFER,
    payload: {
      metaDataID
    },
    meta
  };
}
