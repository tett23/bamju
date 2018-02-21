// @flow

import {
  type Store,
  type Dispatch,
} from 'redux';

import {
  getInstance as getRepositoryManagerInstance,
} from '../common/repository_manager';

import {
  type $ReturnType,
  isSimilarError,
} from '../common/util';

import {
  type State,
  type Actions,
} from '../reducers/main';
import {
  OPEN_BUFFER,
  openBuffer as openBufferAction,
} from '../actions/repositories_tree_view';
import {
  addMessage,
} from '../actions/messages';
import {
  reloadBuffers,
} from '../actions/buffers';

export const repositoriesTreeViewMiddleware = (store: Store<State, Actions>) => (next: Dispatch<Actions>) => (action: Actions) => {
  switch (action.type) {
  case OPEN_BUFFER: {
    const ret = next(action);

    load(store, action);

    return ret;
  }
  default: {
    return next(action);
  }
  }
};

async function load(store: Store<State, Actions>, action: $ReturnType<typeof openBufferAction>) {
  const manager = getRepositoryManagerInstance();
  const metaData = manager.getItemByID(action.payload.metaDataID);
  if (metaData == null) {
    return;
  }

  const [_, message] = await metaData.load();
  if (isSimilarError(message)) {
    store.dispatch(addMessage(message));
    return;
  }

  store.dispatch(reloadBuffers(manager.toBuffers()));
}

export default repositoriesTreeViewMiddleware;
