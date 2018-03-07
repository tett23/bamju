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

    it('該当するBufferが存在しない場合、result.length === 0', async () => {
      search = new Search('id', 'not exist', {
        queryType: QueryTypeFileName,
      }, manager.toBuffers());

      const [result, messages] = map(search);
      messages.forEach((mes) => {
        expect(Message.isSimilarError(mes)).toBe(false);
      });
      expect(result.length).toBe(0);
    });

    it('ItemTypeUndefinedのものは対象に含まれない', async () => {
      search = new Search('id', 'itemTypeUndefined', {
        queryType: QueryTypeFileName,
      }, manager.toBuffers());

      const [result, messages] = map(search);
      messages.forEach((mes) => {
        expect(Message.isSimilarError(mes)).toBe(false);
      });
      expect(result.length).toBe(0);
    });

    describe('String', () => {
      it('enableRegExp === falseのときは文字列の部分一致で検索', async () => {
        search = new Search('id', 't.st', {
          queryType: QueryTypeFileName,
          enableRegExp: false,
        }, manager.toBuffers());

        const [result, messages] = map(search);
        messages.forEach((mes) => {
          expect(Message.isSimilarError(mes)).toBe(false);
        });
        expect(result.length).toBe(0);
      });

      it('ignoreCase === trueのときは大文字小文字を区別しない', async () => {
        search = new Search('id', 'testitem', {
          queryType: QueryTypeFileName,
          enableRegExp: false,
          ignoreCase: true
        }, manager.toBuffers());

        const [result, messages] = map(search);
        messages.forEach((mes) => {
          expect(Message.isSimilarError(mes)).toBe(false);
        });
        expect(result.length).toBe(1);
      });

      it('ignoreCase === falseのときは大文字小文字を区別する', async () => {
        search = new Search('id', 'testitem', {
          queryType: QueryTypeFileName,
          enableRegExp: false,
          ignoreCase: false,
        }, manager.toBuffers());

        const [result, messages] = map(search);
        messages.forEach((mes) => {
          expect(Message.isSimilarError(mes)).toBe(false);
        });
        expect(result.length).toBe(0);
      });
    });

    describe('RegExp', () => {
      it('enableRegExp === trueのときは正規表現で検索', async () => {
        search = new Search('id', 't.st', {
          queryType: QueryTypeFileName,
          enableRegExp: true,
        }, manager.toBuffers());

        const [result, messages] = map(search);
        messages.forEach((mes) => {
          expect(Message.isSimilarError(mes)).toBe(false);
        });
        expect(result.length).toBe(1);
      });

      it('ignoreCase === trueのときは大文字小文字を区別しない', async () => {
        search = new Search('id', 't.stitem', {
          queryType: QueryTypeFileName,
          enableRegExp: true,
          ignoreCase: true
        }, manager.toBuffers());

        const [result, messages] = map(search);
        messages.forEach((mes) => {
          expect(Message.isSimilarError(mes)).toBe(false);
        });
        expect(result.length).toBe(1);
      });

      it('ignoreCase === falseのときは大文字小文字を区別する', async () => {
        search = new Search('id', 't.stitem', {
          queryType: QueryTypeFileName,
          enableRegExp: true,
          ignoreCase: false,
        }, manager.toBuffers());

        const [result, messages] = map(search);
        messages.forEach((mes) => {
          expect(Message.isSimilarError(mes)).toBe(false);
        });
        expect(result.length).toBe(0);
      });
    });
  });
});
