// @flow

import {
  type Actions
} from './app_window';
import {
  RELOAD_BUFFERS,
  UPDATE_BUFFERS,
  type BufferUpdate,
} from '../actions/buffers';

import {
  type Buffer,
} from '../common/buffer';
import {
  type MetaDataID,
} from '../common/metadata';

export type BuffersState = Buffer[];

export function initialBuffersState(): BuffersState {
  return [];
}

export function buffers(state: BuffersState = initialBuffersState(), action: Actions): BuffersState {
  switch (action.type) {
  case RELOAD_BUFFERS: {
    return action.payload.buffers;
  }
  case UPDATE_BUFFERS: {
    return updateBuffers(state, action.payload.updates);
  }
  default:
    return state;
  }
}

// TODO そのうちdeepCopyしないで必要なところだけ更新するようにしたい
function updateBuffers(state: BuffersState, updates: BufferUpdate): BuffersState {
  let ret = state.slice();

  if (updates.removes) {
    ret = removeBuffers(ret, updates.removes);
  }

  if (updates.additions) {
    ret = addBuffers(ret, updates.additions);
  }

  if (updates.changes) {
    ret = changeBuffers(ret, updates.changes);
  }

  return ret;
}

function removeBuffers(state: Buffer[], removes: MetaDataID[]): Buffer[] {
  if (removes.length === 0) {
    return state;
  }

  const ret = state.slice();

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

function addBuffers(state: Buffer[], additions: Buffer[]): Buffer[] {
  if (additions.length === 0) {
    return state;
  }

  const ret = state.slice();

  additions.forEach((buf) => {
    const isExist = ret.some((b) => {
      return b.id === buf.id;
    });
    if (isExist) {
      return;
    }

    ret.push(buf);
  });

  return ret;
}

function changeBuffers(state: Buffer[], changes: Buffer[]): Buffer[] {
  if (changes.length === 0) {
    return state;
  }

  const ret = state.slice();

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
