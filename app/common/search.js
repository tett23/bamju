// @flow

import Fuse from 'fuse.js';
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

const fuseOptions = {
  shouldSort: true,
  tokenize: true,
  matchAllTokens: true,
  includeScore: true,
  includeMatches: true,
  threshold: 0.6,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
};

type FuseResult = {
  item: Buffer,
  matches: {
    indices: Array<[number, number]>
  },
  score: number
};

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
    this.buffers = buffers.filter((item) => {
      return isSimilarFile(item.itemType) || isSimilarDirectory(item.itemType);
    });
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

    let item;
    for (item of iterable()) { // eslint-disable-line no-restricted-syntax
      yield item;
    }
  }

  // eslint-disable-next-line
  *fullText(): Iterable<[?SearchResult, Message.Message[]]> {
    yield [null, []];
  }

  *fileName(): Iterable<[?SearchResult, Message.Message[]]> {
    const options = Object.assign({}, fuseOptions, {
      caseSensitive: !this.options.ignoreCase,
      keys: [{
        name: 'name',
        weight: 0.3
      }, {
        name: 'path',
        weight: 0.7
      }]
    });
    const fuse = new Fuse(this.buffers, options);
    // $FlowFixMe
    const results: FuseResult[] = fuse.search(this.query);

    let item: FuseResult;
    for (item of results) { // eslint-disable-line no-restricted-syntax
      const result = {
        buffer: item.item,
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

export default Search;
