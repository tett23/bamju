// @flow

import {
  type Dispatch,
} from 'redux';
import {
  type State,
} from '../reducers/app_window';
import {
  type Meta,
  type Actions,
} from '../reducers/types';
import {
  type MetaDataID,
  ItemTypeUndefined,
} from '../common/metadata';
import {
  type Buffer,
} from '../common/buffer';
import {
  Search,
  type SearchOptions,
  type SearchProgress,
  type SearchResult,
  defaultOptions,
} from '../common/search';
import * as Message from '../common/message';
import { addMessage } from './messages';

export const SEARCH = 'SEARCH:SEARCH';
export const START = 'SEARCH:START';
export const CANCEL = 'SEARCH:CANCEL';
export const DESTROY = 'SEARCH:DESTROY';
export const CLEAR = 'SEARCH:CLEAR';
export const UPDATE_QUERY = 'SEARCH:UPDATE_QUERY';
export const UPDATE_OPTIONS = 'SEARCH:UPDATE_OPTIONS';
export const UPDATE_RESULT = 'SEARCH:UPDATE_RESULT';
export const UPDATE_PROGRESS = 'SEARCH:UPDATE_PROGRESS';
export const UPDATE_SELECTED_INDEX = 'SEARCH:UPDATE_SELECTED_INDEX';
export const INNCREMENT_PROGRESS = 'SEARCH:INNCREMENT_PROGRESS';
export const COMPLETE = 'SEARCH:COMPLETE';

export function search(query: string, buffer: ?Buffer, options?: SearchOptions = defaultOptions, meta: Meta = {}) {
  return {
    type: SEARCH,
    payload: {
      queryID: `${Math.random()}`,
      query,
      buffer,
      options,
      progress: {
        current: 0,
        total: 0,
      },
      results: [],
      selectedIndex: null,
      completed: false,
    },
    meta: Object.assign(meta, {
      scope: 'local'
    })
  };
}

export function start(queryID: string, meta: Meta = {}) {
  const newMeta = Object.assign({}, meta, {
    scope: 'local'
  });

  return async (dispatch: Dispatch<Actions>, getState: () => State) => {
    dispatch(addMessage(Message.info('search start'), newMeta));
    _start(queryID, dispatch, getState, newMeta);
    dispatch(addMessage(Message.info('search end'), newMeta));
    return dispatch(complete(queryID, newMeta));
  };
}

export function cancel(queryID: string, meta: Meta = {}) {
  return {
    type: CANCEL,
    payload: {
      queryID,
    },
    meta: Object.assign(meta, {
      scope: 'local'
    })
  };
}

export function destroy(queryID: string, meta: Meta = {}) {
  return {
    type: DESTROY,
    payload: {
      queryID,
    },
    meta: Object.assign(meta, {
      scope: 'local'
    })
  };
}

export function clear(queryID: string, meta: Meta = {}) {
  return {
    type: CLEAR,
    payload: {
      queryID,
    },
    meta: Object.assign(meta, {
      scope: 'local'
    })
  };
}

export function updateQuery(queryID: string, query: string, meta: Meta = {}) {
  return {
    type: UPDATE_QUERY,
    payload: {
      queryID,
      query,
    },
    meta: Object.assign(meta, {
      scope: 'local'
    })
  };
}

export function updateOptions(queryID: string, options: SearchOptions, meta: Meta = {}) {
  return {
    type: UPDATE_OPTIONS,
    payload: {
      queryID,
      options,
    },
    meta: Object.assign(meta, {
      scope: 'local'
    })
  };
}

export function updateProgress(queryID: string, progress: SearchProgress, meta: Meta = {}) {
  return {
    type: UPDATE_PROGRESS,
    payload: {
      queryID,
      progress,
    },
    meta: Object.assign(meta, {
      scope: 'local'
    })
  };
}

export function updateResult(queryID: string, result: SearchResult, meta: Meta = {}) {
  return {
    type: UPDATE_RESULT,
    payload: {
      queryID,
      result,
    },
    meta: Object.assign(meta, {
      scope: 'local'
    })
  };
}

export function updateSelectedIndex(queryID: string, selectedIndex: ?number, meta: Meta = {}) {
  return {
    type: UPDATE_SELECTED_INDEX,
    payload: {
      queryID,
      selectedIndex,
    },
    meta: Object.assign(meta, {
      scope: 'local'
    })
  };
}

export function incrementProgress(queryID: string, meta: Meta = {}) {
  return {
    type: INNCREMENT_PROGRESS,
    payload: {
      queryID,
    },
    meta: Object.assign(meta, {
      scope: 'local'
    })
  };
}

export function complete(queryID: string, meta: Meta = {}) {
  return {
    type: COMPLETE,
    payload: {
      queryID,
    },
    meta: Object.assign(meta, {
      scope: 'local'
    })
  };
}

let _inRunning = false;
async function _start(queryID: string, dispatch: Dispatch<Actions>, getState: () => State, meta: Meta) {
  if (_inRunning) {
    return;
  }
  _inRunning = true;

  const state = getState().searches.find((item) => {
    return queryID === item.queryID;
  });
  if (state == null) {
    dispatch(addMessage(Message.info(`search state not found. queryID=${queryID}`), meta));
    return;
  }

  const s = new Search(
    state.queryID,
    state.query,
    state.options,
    targetBuffers(state.options.repositoryName, state.options.targetID, getState().global.buffers)
  );
  dispatch(updateProgress(queryID, {
    current: 0,
    total: s.buffers.length
  }, meta));
  dispatch(clear(queryID));
  let item;
  for (item of s.start()) { // eslint-disable-line no-restricted-syntax
    const [result, messages] = item;
    messages.forEach((mes) => {
      dispatch(addMessage(mes, meta));
    });
    dispatch(incrementProgress(queryID, meta));
    if (result == null) {
      continue;
    }

    dispatch(updateResult(queryID, result, meta));
  }

  _inRunning = false;
}

function targetBuffers(repositoryName: ?string, targetID: ?MetaDataID, buffers: Buffer[]): Buffer[] {
  let ret;
  if (repositoryName == null && targetID == null) {
    ret = buffers;
  } else {
    ret = buffers;
    if (repositoryName) {
      ret = ret.filter((item) => {
        return item.repositoryName === repositoryName;
      });
    }
    if (targetID) {
      const buf = ret.find((item) => {
        return item.id === targetID;
      });
      if (buf == null) {
        return [];
      }

      ret = [buf].concat(children(buf, ret));
    }
  }

  return ret.filter((item) => {
    return item.itemType !== ItemTypeUndefined;
  });
}

function children(buffer: Buffer, buffers: Buffer[]): Buffer[] {
  return buffer.childrenIDs.reduce((r, childID) => {
    const buf = buffers.find((item) => {
      return item.id === childID;
    });
    if (buf == null) {
      return r;
    }

    return r.concat([buf].concat(children(buf, buffers)));
  }, []).filter(Boolean);
}
