// @flow

import {
  type RepositoriesState,
} from '../reducers/repositories';

export const INITIALIZE_REPOSITORIES = 'INITIALIZE_REPOSITORIES';
export const ADD_REPOSITORY = 'ADD_REPOSITORY';
export const REMOVE_REPOSITORY = 'REMOVE_REPOSITORY';

export function initializeRepositories(state: RepositoriesState) {
  return {
    type: INITIALIZE_REPOSITORIES,
    payload: {
      state
    }
  };
}

export function addRepository(absolutePath: string) {
  return {
    type: ADD_REPOSITORY,
    payload: {
      absolutePath,
    }
  };
}

export function removeRepository(absolutePath: string, repositoryName: string) {
  return {
    type: REMOVE_REPOSITORY,
    payload: {
      absolutePath,
      repositoryName
    }
  };
}
