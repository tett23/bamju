// @flow

import { type Meta } from '../reducers/types';
import {
  type Buffer,
} from '../common/buffer';
import {
  type SearchOptions,
  type SearchProgress,
  type SearchResult,
  defaultOptions,
} from '../common/search';

export const SEARCH = 'SEARCH:SEARCH';
export const UPDATE_RESULT = 'SEARCH:UPDATE_RESULT';
export const UPDATE_PROGRESS = 'SEARCH:UPDATE_PROGRESS';
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
      result: [],
      completed: false,
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

export function updateResult(queryID: string, result: SearchResult, meta: Meta = {}) {
  return {
    type: UPDATE_RESULT,
    payload: {
      queryID,
      result,
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
