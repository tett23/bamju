// @flow

import { type Dispatch } from 'redux';

import * as Message from './message';
import { type Buffer } from './buffer';
import {
  type MetaDataID,
  isSimilarFile,
  isSimilarDirectory,
} from './metadata';
import {
  getInstance as getRepositoryManagerInstance
} from './repository_manager';

import {
  type Actions,
} from '../reducers/types';

import {
  updateProgress,
  updateResult,
} from '../actions/searches';

export const QueryTypeFileName = 'fileName';
export const QueryTypeFullText = 'fullText';
export type QueryType = 'fileName' | 'fullText';

export type SearchOptions = {
  queryType: QueryType,
  targetID?: ?MetaDataID,
  repositoryName?: string,
  enableRegExp?: boolean,
  ignoreCase?: boolean
};

export type SearchProgress = {
  current: number,
  total: number
};

export type SearchResult = {
  buffer: Buffer
};

export const defaultOptions:SearchOptions = {
  queryType: 'fileName',
  targetID: null,
  repositoryName: '',
  enableRegExp: false,
  ignoreCase: false
};

export class Search {
  queryID: string;
  query: string;
  options: SearchOptions;
  buffers: Buffer[];
  dispatch: null | Dispatch<Actions>

  constructor(
    queryID: string,
    query: string,
    options: SearchOptions,
    buffers?: Buffer[],
    dispatch?: Dispatch<Actions>
  ) {
    this.queryID = queryID;
    this.query = query;
    this.options = Object.assign({}, defaultOptions, options);
    this.buffers = buffers || targetBuffers(options.repositoryName, options.targetID);
    this.dispatch = dispatch || null;
  }

  async start(): Promise<[SearchResult[], Message.Message[]]> {
    if (this.buffers.length === 0) {
      return [[], [Message.fail('')]];
    }
    this.dispatchUpdateProgress({
      current: 0,
      total: this.buffers.length
    });

    switch (this.options.queryType) {
    case QueryTypeFullText: {
      const ret = await this.fullText();
      return ret;
    }
    case QueryTypeFileName: {
      const ret = await this.fileName();
      return ret;
    }
    default:
      return [[], [Message.error(`Search.start invalid QueryType. queryType=${this.options.queryType}`)]];
    }
  }

  // eslint-disable-next-line
  async fullText(): Promise<[SearchResult[], Message.Message[]]> {
    return [[], []];
  }

  async fileName(): Promise<[SearchResult[], Message.Message[]]> {
    const total = this.buffers.length;
    const ret = [];
    const flags = this.options.ignoreCase ? 'i' : '';
    const matcher = new RegExp(this.query, flags);
    for (let i = 0; i < total; i += 1) {
      let isMatch = false;
      const itemType = this.buffers[i].itemType;
      if (isSimilarFile(itemType) || isSimilarDirectory(itemType)) {
        if (this.options.enableRegExp) {
          isMatch = matcher.test(this.buffers[i].path);
        } else if (this.options.ignoreCase) {
          isMatch = this.buffers[i].path.toLowerCase().includes(this.query.toLowerCase());
        } else {
          isMatch = this.buffers[i].path.includes(this.query);
        }
      }

      this.dispatchUpdateProgress({
        current: i + 1,
        total,
      });

      if (isMatch) {
        const result = {
          buffer: this.buffers[i]
        };
        this.dispatchUpdateResult(result);
        ret.push(result);
      }
    }

    return [ret, [
      Message.success('')
    ]];
  }

  async dispatchUpdateProgress(progress: SearchProgress) {
    if (this.dispatch == null) {
      return;
    }

    // $FlowFixMe
    this.dispatch(updateProgress(this.queryID, progress));
  }

  async dispatchUpdateResult(result: SearchResult) {
    if (this.dispatch == null) {
      return;
    }

    // $FlowFixMe
    this.dispatch(updateResult(this.queryID, result));
  }
}

function targetBuffers(repositoryName: ?string, targetID: ?MetaDataID): Buffer[] {
  const manager = getRepositoryManagerInstance();
  if (targetID == null && repositoryName == null) {
    return manager.toBuffers();
  }
  if (targetID == null) {
    const repo = manager.find(repositoryName || '');
    if (repo == null) {
      return [];
    }
  }

  const metaData = manager.getItemByID(targetID || '');
  if (metaData == null) {
    return [];
  }

  const repo = manager.find(metaData.repositoryName);
  if (repo == null) {
    return [];
  }

  const ret = [];
  for (const id of metaData.getIDs()) { // eslint-disable-line no-restricted-syntax
    ret.push(repo.getItemByID(id));
  }

  return ret.filter(Boolean);
}

export default Search;
