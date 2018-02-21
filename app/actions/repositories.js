// @flow

import {
  type RepositoriesState,
} from '../reducers/repositories';

export const INITIALIZE_REPOSITORIES = 'INITIALIZE_REPOSITORIES';
export const ADD_REPOSITORY = 'ADD_REPOSITORY';
export const REMOVE_REPOSITORY = 'REMOVE_REPOSITORY';
export const CREATE_FILE = 'CREATE_FILE';

export function initializeRepositories(state: RepositoriesState, meta: Object = {}) {
  return {
    type: INITIALIZE_REPOSITORIES,
    payload: {
      state
    },
    meta
  };
}

export function addRepository(absolutePath: string, meta: Object = {}) {
  return {
    type: ADD_REPOSITORY,
    payload: {
      absolutePath,
    },
    meta
  };
}

export function removeRepository(absolutePath: string, repositoryName: string, meta: Object = {}) {
  return {
    type: REMOVE_REPOSITORY,
    payload: {
      absolutePath,
      repositoryName
    },
    meta
  };
}

export function createFile(repositoryName: string, path: string, meta: Object = {}) {
  return {
    type: CREATE_FILE,
    payload: {
      repositoryName,
      path
    },
    meta
  };
}
