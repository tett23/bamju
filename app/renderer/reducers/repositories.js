// @flow

import {
  type ActionTypes
} from './combined';
import {
  RELOAD_REPOSITORIES,
  UPDATE_BUFFERS,
  ADD_BUFFERS,
  REMOVE_BUFFERS,
} from '../actions/repositories';

import {
  deepCopy,
} from '../../common/util';

import type { Buffer } from '../../common/buffer';

export type RepositoriesState = {[string]: Buffer[]};

export function initialRepositoriesState(): RepositoriesState {
  return {};
}

export function repositories(state: RepositoriesState = initialRepositoriesState(), action: ActionTypes): RepositoriesState {
  switch (action.type) {
  case RELOAD_REPOSITORIES: {
    return deepCopy(action.repositories);
  }
  case UPDATE_BUFFERS: {
    return updateBuffers(state, action.buffers);
  }
  case ADD_BUFFERS: {
    return addBuffers(state, action.buffers);
  }
  case REMOVE_BUFFERS: {
    return removeBuffers(state, action.buffers);
  }
  default:
    return state;
  }
}

// TODO そのうちdeepCopyしないで必要なところだけ更新するようにしたい
function updateBuffers(state: RepositoriesState, updates: Buffer[]): RepositoriesState {
  const ret = deepCopy(state);
  updates.forEach((buf) => {
    const repo = ret[buf.repositoryName];
    if (repo == null) {
      return;
    }

    const idx = repo.findIndex((b) => {
      return b.id === buf.id;
    });
    if (idx === -1) {
      return;
    }

    repo[idx] = buf;
  });

  return ret;
}

function addBuffers(state: RepositoriesState, additions: Buffer[]): RepositoriesState {
  const ret = deepCopy(state);
  additions.forEach((buf) => {
    ret[buf.repositoryName] = ret[buf.repositoryName] || [];

    const isExist = ret[buf.repositoryName].some((b) => {
      return b.id === buf.id;
    });
    if (!isExist) {
      ret[buf.repositoryName].push(buf);
    }
  });

  return ret;
}

function removeBuffers(state: RepositoriesState, removes: Buffer[]): RepositoriesState {
  const ret = deepCopy(state);
  removes.forEach((buf) => {
    const repo = ret[buf.repositoryName];
    if (repo == null) {
      return;
    }

    const idx = repo.findIndex((b) => {
      return b.id === buf.id;
    });
    if (idx === -1) {
      return;
    }

    repo.splice(idx, 1);
  });

  return ret;
}
