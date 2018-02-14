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

export type RepositoriesState = {
  buffers: Buffer[]
};

export function initialRepositoriesState(): RepositoriesState {
  return {
    buffers: []
  };
}

export function repositories(state: RepositoriesState = initialRepositoriesState(), action: ActionTypes): RepositoriesState {
  switch (action.type) {
  case RELOAD_REPOSITORIES: {
    return {
      buffers: action.buffers
    };
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
    const idx = ret.buffers.findIndex((b) => {
      return b.id === buf.id;
    });
    if (idx === -1) {
      return;
    }

    ret.buffers[idx] = buf;
  });

  return ret;
}

function addBuffers(state: RepositoriesState, additions: Buffer[]): RepositoriesState {
  const ret = deepCopy(state);
  additions.forEach((buf) => {
    const isExist = ret.buffers.some((b) => {
      return b.id === buf.id;
    });
    if (!isExist) {
      ret.buffers.push(buf);
    }
  });

  return ret;
}

function removeBuffers(state: RepositoriesState, removes: Buffer[]): RepositoriesState {
  const ret = deepCopy(state);
  removes.forEach((buf) => {
    const idx = ret.buffers.findIndex((b) => {
      return b.id === buf.id;
    });
    if (idx === -1) {
      return;
    }

    ret.buffers.splice(idx, 1);
  });

  return ret;
}
