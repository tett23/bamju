// @flow

import {
  type Store,
  type Dispatch,
} from 'redux';

import {
  getInstance as getRepositoryManagerInstance
} from '../common/repository_manager';

import {
  type $ReturnType,
  isSimilarError,
} from '../common/util';
import path from '../common/path';

import {
  type State,
  type Actions,
} from '../reducers/main';
import {
  INITIALIZE_REPOSITORIES,
  ADD_REPOSITORY,
  REMOVE_REPOSITORY,
  initializeRepositories as initializeRepositoriesAction,
  addRepository as addRepositoryAction,
  removeRepository as removeRepositoryAction,
} from '../actions/repositories';
import {
  reloadBuffers as reloadBuffersAction,
} from '../actions/buffers';
import {
  addMessage,
} from '../actions/messages';

export const repositoriesMiddleware = (store: Store<State, Actions>) => (next: Dispatch<Actions>) => (action: Actions) => {
  console.log('repositoriesMiddleware', action);
  switch (action.type) {
  case INITIALIZE_REPOSITORIES: {
    next(action);
    initializeRepositories(store, action);
    return;
  }
  case ADD_REPOSITORY: {
    next(action);
    addRepository(store, action);
    return;
  }
  case REMOVE_REPOSITORY: {
    next(action);
    removeRepository(store, action);
    return;
  }
  default: {
    return next(action);
  }
  }
};

function initializeRepositories(store: Store<State, Actions>, _: $ReturnType<typeof initializeRepositoriesAction>) {
  const manager = getRepositoryManagerInstance();

  store.dispatch(async (dispatch) => {
    await manager.loadRepositories();
    dispatch(reloadBuffersAction(manager.toBuffers()));
  });
}

function addRepository(store: Store<State, Actions>, action: $ReturnType<typeof addRepositoryAction>) {
  const manager = getRepositoryManagerInstance();

  const repositoryName = path.dirname(action.payload.absolutePath);
  const conf = {
    absolutePath: action.absolutePath,
    repositoryName
  };

  const [repo, addRepositoryMessage] = manager.addRepository(conf, []);
  if (repo == null || isSimilarError(addRepositoryMessage)) {
    store.dispatch(addMessage(addRepositoryMessage));
  }

  store.dispatch(reloadBuffersAction(manager.toBuffers()));
}

function removeRepository(store: Store<State, Actions>, action: $ReturnType<typeof removeRepositoryAction>) {
  const manager = getRepositoryManagerInstance();

  const repo = manager.removeRepository(action.payload.repositoryName);
  if (repo == null) {
    return;
  }

  store.dispatch(reloadBuffersAction(manager.toBuffers()));
}

export default repositoriesMiddleware;
