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
  threshold: 0.4,
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
  positions: Position[],
  detail: null | {
    text: string,
    positions: Position[]
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
    for (item of iterable(this.query)) { // eslint-disable-line no-restricted-syntax
      yield item;
    }
  }

  // eslint-disable-next-line
  *fullText(query: string): Iterable<[?SearchResult, Message.Message[]]> {
    yield [null, []];
  }

  *fileName(query: string): Iterable<[?SearchResult, Message.Message[]]> {
    const options = Object.assign({}, fuseOptions, {
      caseSensitive: !this.options.ignoreCase,
      keys: ['path']
    });
    const init = this.buffers.map((item) => {
      return {
        item,
        matches: [
          {
            indices: []
          }
        ]
      };
    });

    const results: FuseResult[] = query.split('/').reduce((prevResult: FuseResult[], q: string) => {
      const bufs = prevResult.map((item) => {
        return item.item;
      });
      const fuse = new Fuse(bufs, options);

      // $FlowFixMe
      const tmp:FuseResult[] = fuse.search(q);
      tmp.forEach((item) => {
        const prev = prevResult.find((i) => {
          return i.item.id === item.item.id;
        });
        if (prev == null) {
          return;
        }

        // eslint-disable-next-line no-param-reassign
        item.matches[0].indices = item.matches[0].indices.concat(prev.matches[0].indices);
      });
      // $FlowFixMe
      return tmp;
      // $FlowFixMe
    }, init);

    let item: FuseResult;
    for (item of results) { // eslint-disable-line no-restricted-syntax
      const positions = item.matches[0].indices.sort((a, b) => {
        if (a[0] === b[0]) {
          return 0;
        }

        return a[0] < b[0] ? -1 : 1;
      }).map((index) => {
        return {
          size: (index[1] - index[0]) + 1,
          offset: index[0],
        };
      });

      const result = {
        buffer: item.item,
        positions,
        detail: null,
      };
      yield [result, []];
    }
  }
}

export default Search;
