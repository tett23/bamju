// @flow

import {
  type Actions
} from './types';
import {
  type MetaDataID,
} from '../common/metadata';
import {
  INITIALIZE_REPOSITORIES_TREE_VIEW,
  OPEN_BUFFER,
  CLOSE_BUFFER,
} from '../actions/repositories_tree_view';
import {
  type BuffersState,
  initialBuffersState,
} from './buffers';

export type BufferState = {
  isOpened: boolean
};

export type RepositoriesTreeViewState = {
  [MetaDataID]: BufferState
};

export function initialBufferState() {
  return {
    isOpened: false
  };
}

export function initialRepositoriesTreeViewState() {
  return {};
}

export function repositoriesTreeView(
  state: RepositoriesTreeViewState = initialRepositoriesTreeViewState(),
  action: Actions,
  buffers: BuffersState = initialBuffersState()
): RepositoriesTreeViewState {
  switch (action.type) {
  case INITIALIZE_REPOSITORIES_TREE_VIEW: {
    return action.payload;
  }
  case OPEN_BUFFER: {
    return openBuffer(state, action.payload.metaDataID, buffers);
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

function openBuffer(state: RepositoriesTreeViewState, metaDataID: MetaDataID, buffers: BuffersState): RepositoriesTreeViewState {
  const current = state[metaDataID];
  if (current != null && current.isOpened) {
    return state;
  }

  const newState = Object.assign({}, state);
  newState[metaDataID] = Object.assign({}, newState[metaDataID], {
    isOpened: true
  });

  const buf = buffers.find((item) => {
    return item.id === metaDataID;
  });
  if (buf == null || buf.parentID == null) {
    return newState;
  }

  let parent = buffers.find((item) => {
    return item.id === buf.parentID;
  });
  while (parent != null) {
    newState[parent.id] = Object.assign({}, newState[parent.id], {
      isOpened: true
    });

    if (parent.parentID == null) {
      break;
    }

    const parentID = parent.parentID;
    parent = buffers.find((item) => { // eslint-disable-line
      return item.id === parentID;
    });
  }

  return newState;
}

export default repositoriesTreeView;
