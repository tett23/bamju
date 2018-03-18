// @flow
/* eslint no-restricted-syntax: 0 */

import {
  RepositoryManager,
} from '../../app/common/repository_manager';
import * as Message from '../../app/common/message';
import {
  Search,
  QueryTypeFileName,
} from '../../app/common/search';
import {
  ItemTypeUndefined,
} from '../../app/common/metadata';

import {
  dummy,
} from '../test_utils';

let manager: RepositoryManager;
beforeEach(() => {
  const buffers = dummy({
    test: [
      '/foo/bar/baz/testItem.md',
      '/itemTypeUndefined'
    ]
  });
  // $FlowFixMe
  buffers.find((item) => {
    return item.name === 'itemTypeUndefined';
  }).itemType = ItemTypeUndefined;

  manager = new RepositoryManager(buffers, [{
    repositoryName: 'test',
    absolutePath: '/tmp/bamju/test'
  }]);
});

function map(search) {
  const result = [];
  let messages = [];
  for (const [r, m] of search.start()) {
    if (r != null) {
      result.push(r);
    }
    messages = messages.concat(m);
  }

  return [result, messages];
}

describe('Search', () => {
  describe('fileName', () => {
    let search;
    beforeEach(() => {
      search = new Search('id', 'test', {
        queryType: QueryTypeFileName,
      }, manager.toBuffers());
    });

    it('検索ができる', async () => {
      search = new Search('id', 'test', {
        queryType: QueryTypeFileName,
      }, manager.toBuffers());

      const [result, messages] = map(search);
      messages.forEach((mes) => {
        expect(Message.isSimilarError(mes)).toBe(false);
      });
      expect(result.length).toBe(1);
    });
  });
});
