// @flow

import { type Meta } from '../reducers/types';
import {
  type SearchOptions,
  type SearchProgress,
  type SearchResult,
} from '../common/search';

export const SEARCH = 'SEARCH:SEARCH';
export const UPDATE_RESULT = 'SEARCH:UPDATE_RESULT';
export const UPDATE_PROGRESS = 'SEARCH:UPDATE_PROGRESS';
export const COMPLETE = 'SEARCH:COMPLETE';

export function search(query: string, options: SearchOptions, meta: Meta = {}) {
  return {
    type: SEARCH,
    payload: {
      queryID: `${Math.random()}`,
      query,
      options
    },
    meta
  };
}

export function updateProgress(queryID: string, progress: SearchProgress, meta: Meta = {}) {
  return {
    type: UPDATE_PROGRESS,
    payload: {
      queryID,
      progress,
    },
    meta
  };
}

export function updateResult(queryID: string, searchResult: SearchResult, meta: Meta = {}) {
  return {
    type: UPDATE_RESULT,
    payload: {
      queryID,
      searchResult
    },
    meta
  };
}

export function complete(queryID: string, meta: Meta = {}) {
  return {
    type: COMPLETE,
    payload: {
      queryID,
    },
    meta
  };
}
