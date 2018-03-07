// @flow

import {
  type Actions
} from './types';

import {
  SEARCH,
  CANCEL,
  DESTROY,
  UPDATE_QUERY,
  UPDATE_OPTIONS,
  UPDATE_RESULT,
  UPDATE_PROGRESS,
  INNCREMENT_PROGRESS,
  COMPLETE,
} from '../actions/searches';

import {
  type Buffer,
} from '../common/buffer';
import {
  type SearchOptions,
  type SearchProgress,
  type SearchResult,
} from '../common/search';

export type SearchState = {
  queryID: string,
  query: string,
  buffer: ?Buffer,
  options: SearchOptions,
  progress: SearchProgress,
  results: SearchResult[],
  completed: boolean
};

export type SearchesState = SearchState[];

export function initialSearchesState(): SearchesState {
  return [];
}

export function searches(
  state: SearchesState = initialSearchesState(),
  action: Actions
): SearchesState {
  switch (action.type) {
  case SEARCH: {
    const idx = findIndex(action.payload.queryID, state);
    if (idx !== -1) {
      return state;
    }
    const newState = state.slice();
    newState.push(action.payload);

    return newState;
  }
  case CANCEL: {
    const idx = findIndex(action.payload.queryID, state);
    if (idx === -1) {
      return state;
    }
    const newState = state.slice();
    newState[idx].completed = true;

    return newState;
  }
  case DESTROY: {
    const idx = findIndex(action.payload.queryID, state);
    if (idx === -1) {
      return state;
    }
    const newState = state.slice();
    newState.splice(idx, 1);

    return newState;
  }
  case UPDATE_QUERY: {
    const idx = findIndex(action.payload.queryID, state);
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
    newState[idx].query = action.payload.query;

    return newState;
  }
  case UPDATE_OPTIONS: {
    const idx = findIndex(action.payload.queryID, state);
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
    newState[idx].options = action.payload.options;

    return newState;
  }
  case UPDATE_PROGRESS: {
    const idx = findIndex(action.payload.queryID, state);
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
    newState[idx].progress = action.payload.progress;

    return newState;
  }
  case UPDATE_RESULT: {
    const idx = findIndex(action.payload.queryID, state);
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
    newState[idx].results.push(action.payload.result);

    return newState;
  }
  case INNCREMENT_PROGRESS: {
    const idx = findIndex(action.payload.queryID, state);
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
    newState[idx].progress.current += 1;

    return newState;
  }
  case COMPLETE: {
    const idx = findIndex(action.payload.queryID, state);
    if (idx === -1) {
      return state;
    }

    const newState = state.slice();
    newState[idx].completed = true;

    return newState;
  }
  default:
    return state;
  }
}

// const _manager:Search[] = [];
//
// function cancel(queryID: string) {
//   const idx = _manager.findIndex((item) => {
//     return queryID === item.queryID;
//   });
//   if (idx === -1) {
//     return;
//   }
//
//   _manager.splice(idx, 1);
// }

function findIndex(queryID: string, items: SearchesState): number {
  return items.findIndex((item) => {
    return item.queryID === queryID;
  });
}

export default searches;
