// @flow

import {
  type $ReturnType,
} from '../common/util';

import {
  initializeRepositories,
  addRepository,
  removeRepository,
} from '../actions/repositories';
import {
  reloadBuffers,
  updateBuffers,
} from '../actions/buffers';

import {
  repositories,
  type RepositoriesState,
  initialRepositoriesState,
} from './repositories';
import {
  buffers,
  type BuffersState,
  initialBuffersState,
} from './buffers';

export type Actions = $ReturnType<typeof initializeRepositories>
| $ReturnType<typeof addRepository>
| $ReturnType<typeof removeRepository>
| $ReturnType<typeof reloadBuffers>
| $ReturnType<typeof updateBuffers>;

export type State = {
  repositories: RepositoriesState,
  buffers: BuffersState
};

export function initialState(): State {
  return {
    repositories: initialRepositoriesState(),
    buffers: initialBuffersState(),
  };
}

// なぜかcombineReducerが動かないので無理矢理
export function appReducer(s: State, a: Actions) {
  return {
    repositories: repositories(s.repositories, a),
    buffers: buffers(s.buffers, a),
  };
}

export default appReducer;
