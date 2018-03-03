// @flow

import {
  type Store,
  type Dispatch,
} from 'redux';

import {
  getInstance as getRepositoryManagerInstance
} from '../common/repository_manager';

import {
  resolveInternalPath,
} from '../common/metadata';
import {
  type $ReturnType,
} from '../common/util';
import {
  isSimilarError,
  MessageTypeFailed,
  MessageTypeError,
} from '../common/message';
import path from '../common/path';

import {
  type State,
} from '../reducers/main';
import {
  type Actions,
} from '../reducers/types';
import {
  INITIALIZE_REPOSITORIES,
  ADD_REPOSITORY,
  REMOVE_REPOSITORY,
  CREATE_FILE,
  initializeRepositories as initializeRepositoriesAction,
  addRepository as addRepositoryAction,
  removeRepository as removeRepositoryAction,
  createFile as createFileAction,
} from '../actions/repositories';
import {
  reloadBuffers as reloadBuffersAction,
} from '../actions/buffers';
import {
  closeAllDialog,
} from '../actions/modals';
import {
  updateCurrentTab,
} from '../actions/browser';
import {
  openBuffer as openBufferItem,
} from '../actions/repositories_tree_view';
import {
  addMessage,
} from '../actions/messages';

export const repositoriesMiddleware = (store: Store<State, Actions>) => (next: Dispatch<Actions>) => (action: Actions) => {
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
  case CREATE_FILE: {
    next(action);
    createFile(store, action);
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

async function createFile(store: Store<State, Actions>, action: $ReturnType<typeof createFileAction>) {
  const manager = getRepositoryManagerInstance();

  const info = resolveInternalPath(action.payload.path);
  if (info.repositoryName == null) {
    info.repositoryName = action.payload.repositoryName;
  }

  const repo = manager.find(info.repositoryName || '');
  if (repo == null) {
    const mes = {
      type: MessageTypeFailed,
      message: `repositoriesMiddleware repository not found error: repositoryName=${info.repositoryName || ''}`,
    };
    store.dispatch(addMessage(mes, { targetWindowID: action.meta.fromWindowID }));
    return;
  }

  const [metaData, message] = await repo.addFile(info.path, '');
  if (metaData == null || isSimilarError(message)) {
    const mes = {
      type: MessageTypeFailed,
      message: `repositoriesMiddleware error: ${message.message}`,
    };
    store.dispatch(addMessage(mes, { targetWindowID: action.meta.fromWindowID }));
    return;
  }

  const [parseResult, parseMessage] = await metaData.parse();
  if (isSimilarError(parseMessage)) {
    store.dispatch(addMessage(parseMessage, { targetWindowID: action.meta.fromWindowID }));
    return;
  }
  if (parseResult == null) {
    store.dispatch(addMessage({
      type: MessageTypeError,
      message: `repositoriesMiddleware parseResult error. repositoryName=${action.payload.repositoryName} path=${action.payload.path}`
    }, { targetWindowID: action.meta.fromWindowID }));
    return;
  }

  store.dispatch(reloadBuffersAction(manager.toBuffers()));
  store.dispatch(openBufferItem(metaData.id, { targetWindowID: action.meta.fromWindowID }));
  store.dispatch(updateCurrentTab(metaData.id, parseResult.content, { targetWindowID: action.meta.fromWindowID }));
  store.dispatch(closeAllDialog({ targetWindowID: action.meta.fromWindowID }));
}

export default repositoriesMiddleware;
