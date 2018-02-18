// @flow

export const ADD_REPOSITORY = 'ADD_REPOSITORY';
export const REMOVE_REPOSITORY = 'REMOVE_REPOSITORY';

export function addRepository(absolutePath: string) {
  return {
    type: ADD_REPOSITORY,
    absolutePath,
  };
}

export function removeRepository(absolutePath: string, repositoryName: string) {
  return {
    type: REMOVE_REPOSITORY,
    absolutePath,
    repositoryName
  };
}
