// @flow

import { type Meta } from '../reducers/types';
import {
  type RepositoriesState,
} from '../reducers/repositories';
import {
  type MetaDataID,
} from '../common/metadata';

export const INITIALIZE_REPOSITORIES = 'INITIALIZE_REPOSITORIES';
export const ADD_REPOSITORY = 'ADD_REPOSITORY';
export const REMOVE_REPOSITORY = 'REMOVE_REPOSITORY';
export const CREATE_FILE = 'CREATE_FILE';
export const CREATE_DIRECTORY = 'CREATE_DIRECTORY';
export const RENAME = 'RENAME';

export function initializeRepositories(state: RepositoriesState, meta: Meta = {}) {
  return {
    type: INITIALIZE_REPOSITORIES,
    payload: {
      state
    },
    meta
  };
}

export function addRepository(absolutePath: string, meta: Meta = {}) {
  return {
    type: ADD_REPOSITORY,
    payload: {
      absolutePath,
    },
    meta
  };
}

export function removeRepository(absolutePath: string, repositoryName: string, meta: Meta = {}) {
  return {
    type: REMOVE_REPOSITORY,
    payload: {
      absolutePath,
      repositoryName
    },
    meta
  };
}

export function createFile(repositoryName: string, path: string, templateID: ?MetaDataID = null, meta: Meta = {}) {
  return {
    type: CREATE_FILE,
    payload: {
      repositoryName,
      path,
      templateID
    },
    meta
  };
}

export function createDirectory(repositoryName: string, path: string, meta: Meta = {}) {
  return {
    type: CREATE_DIRECTORY,
    payload: {
      repositoryName,
      path
    },
    meta
  };
}

export function rename(metaDataID: MetaDataID, path: string, meta: Meta = {}) {
  return {
    type: RENAME,
    payload: {
      metaDataID,
      path
    },
    meta
  };
}
