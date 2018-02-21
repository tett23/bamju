// @flow

import path from '../common/path';
import {
  type Actions,
} from './types';
import {
  INITIALIZE_REPOSITORIES,
  ADD_REPOSITORY,
  REMOVE_REPOSITORY,
} from '../actions/repositories';
import {
  type RepositoryConfig
} from '../common/repository';

export type RepositoriesState = RepositoryConfig[];

export function initialRepositoriesState() {
  return [];
}

export function repositories(state: RepositoriesState = initialRepositoriesState(), action: Actions): RepositoriesState {
  switch (action.type) {
  case INITIALIZE_REPOSITORIES: {
    return action.payload.state;
  }
  case ADD_REPOSITORY: {
    const absolutePath = action.payload.absolutePath;
    const isExist = state.some((item) => {
      return item.absolutePath === absolutePath;
    });
    if (isExist) {
      return state;
    }

    const newState = state.slice();
    newState.push({
      absolutePath,
      repositoryName: path.basename(absolutePath)
    });

    return newState;
  }
  case REMOVE_REPOSITORY: {
    const { absolutePath, repositoryName } = action.payload;
    const idx = state.findIndex((item) => {
      return item.absolutePath === absolutePath && item.repositoryName === repositoryName;
    });
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
    newState.splice(idx, 1);

    return newState;
  }
  default: return state;
  }
}
