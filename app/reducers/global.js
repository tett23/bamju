// @flow

import { type Actions } from './types';
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
