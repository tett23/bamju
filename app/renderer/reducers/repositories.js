// @flow

import {
  type ActionTypes
} from './combined';
import {
  RELOAD_REPOSITORIES,
  UPDATE_BUFFERS,
  type BufferUpdate,
} from '../actions/repositories';

import {
  deepCopy,
} from '../../common/util';

import {
  type Buffer,
} from '../../common/buffer';
import {
  type MetaDataID,
} from '../../common/metadata';

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
    return updateBuffers(state, action.updates);
  }
  default:
    return state;
  }
}

// TODO そのうちdeepCopyしないで必要なところだけ更新するようにしたい
function updateBuffers(state: RepositoriesState, updates: BufferUpdate): RepositoriesState {
  const ret = deepCopy(state);

  if (updates.removes) {
    ret.buffers = removeBuffers(ret.buffers, updates.removes);
  }

  if (updates.additions) {
    ret.buffers = addBuffers(ret.buffers, updates.additions);
  }

  if (updates.changes) {
    ret.buffers = changeBuffers(ret.buffers, updates.changes);
  }

  return ret;
}

function removeBuffers(buffers: Buffer[], removes: MetaDataID[]): Buffer[] {
  if (removes.length === 0) {
    return buffers;
  }

  const ret = buffers.slice();

  removes.forEach((id) => {
    const idx = ret.findIndex((buf) => {
      return buf.id === id;
    });
    if (idx === -1) {
      return;
    }

    ret.splice(idx, 1);
  });

  return ret;
}

function addBuffers(buffers: Buffer[], additions: Buffer[]): Buffer[] {
  if (additions.length === 0) {
    return buffers;
  }

  const ret = buffers.slice();

  additions.forEach((buf) => {
    const isExist = ret.some((b) => {
      return b.id === buf.id;
    });
    if (!isExist) {
      ret.push(buf);
    }
  });

  return ret;
}

function changeBuffers(buffers: Buffer[], changes: Buffer[]): Buffer[] {
  if (changes.length === 0) {
    return buffers;
  }

  const ret = buffers.slice();

  changes.forEach((buf) => {
    const idx = ret.findIndex((b) => {
      return b.id === buf.id;
    });
    if (idx === -1) {
      return;
    }

    ret[idx] = buf;
  });

  return ret;
}
