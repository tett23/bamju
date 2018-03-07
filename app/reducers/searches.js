// @flow

import {
  type Actions
} from './types';

import {
  SEARCH,
  UPDATE_RESULT,
  UPDATE_PROGRESS,
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
  result: SearchResult[],
  completed: boolean
};

export type SearchesState = SearchState[];

export function initialSearchesState(): SearchesState {
  return [];
}

export function searches(state: SearchesState = initialSearchesState(), action: Actions): SearchesState {
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
    newState[idx].result.push(action.payload.result);

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

function findIndex(queryID: string, items: SearchesState): number {
  return items.findIndex((item) => {
    return item.queryID === queryID;
  });
}

export default searches;
