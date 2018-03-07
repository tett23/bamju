// @flow

import * as Message from './message';
import { type Buffer } from './buffer';
import {
  type MetaDataID,
  isSimilarFile,
  isSimilarDirectory,
} from './metadata';

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

export type Position = {
  size: number,
  offset: number
};

export type SearchResult = {
  buffer: Buffer,
  position: Position,
  detail: null | {
    text: string,
    position: Position
  }
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

  constructor(
    queryID: string,
    query: string,
    options: SearchOptions,
    buffers: Buffer[],
  ) {
    this.queryID = queryID;
    this.query = query;
    this.options = Object.assign({}, defaultOptions, options);
    this.buffers = buffers;
  }

  *start(): Iterable<[?SearchResult, Message.Message[]]> {
    if (this.buffers.length === 0) {
      yield [null, [Message.fail('')]];
      return;
    }

    let iterable;
    switch (this.options.queryType) {
    case QueryTypeFullText: {
      iterable = this.fullText.bind(this);
      break;
    }
    case QueryTypeFileName: {
      iterable = this.fileName.bind(this);
      break;
    }
    default:
      yield [null, [Message.error(`Search.start invalid QueryType. queryType=${this.options.queryType}`)]];
      return;
    }

    for (const item of iterable()) { // eslint-disable-line no-restricted-syntax
      yield item;
    }
  }

  // eslint-disable-next-line
  *fullText(): Iterable<[?SearchResult, Message.Message[]]> {
    yield [null, []];
  }

  *fileName(): Iterable<[?SearchResult, Message.Message[]]> {
    const total = this.buffers.length;
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

      if (!isMatch) {
        yield [null, []];
      } else {
        const result = {
          buffer: this.buffers[i],
          position: {
            size: 0,
            offset: 0,
          },
          detail: null,
        };
        yield [result, []];
      }
    }
  }
}

export default Search;
