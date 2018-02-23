// @flow

import '../../global_config.test';
import {
  dummy,
} from '../../test_utils';

import {
  Markdown,
} from '../../../app/main/parser/markdown';
import {
  RepositoryManager,
} from '../../../app/common/repository_manager';
import {
  MetaData,
} from '../../../app/common/metadata';

let manager:RepositoryManager;
let metaData:MetaData;
beforeEach(() => {
  const buffers = dummy({
    test: [
      '/foo/bar/baz/testItem.md'
    ],
    testRepo: [
      'foo'
    ]
  });

  manager = new RepositoryManager(buffers, [{
    repositoryName: 'test',
    absolutePath: '/tmp/bamju/test'
  }, {
    repositoryName: 'testRepo',
    absolutePath: '/tmp/bamju/testRepo'
  }]);
  // $FlowFixMe
  metaData = manager.find('test').getItemByPath('/foo/bar/baz/testItem.md');
});

describe('Markdown', () => {
  describe('wiki link', () => {
    it('[[repo:foo#fragment]]{text}', async () => {
      const html = await Markdown.parse(metaData, '[[repo:foo#fragment]]{text}', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>text<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="repo:foo".*?>/);
      expect(html.content).toMatch(/<span.*?data-repository-name="repo".*?>/);
      expect(html.content).toMatch(/<span.*?data-fragment="fragment".*?>/);
    });

    it('[[repo:foo#fragment]]', async () => {
      const html = await Markdown.parse(metaData, '[[repo:foo#fragment]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>foo<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="repo:foo".*?>/);
      expect(html.content).toMatch(/<span.*?data-repository-name="repo".*?>/);
      expect(html.content).toMatch(/<span.*?data-fragment="fragment".*?>/);
    });

    it('[[foo#fragment]]{text}', async () => {
      const html = await Markdown.parse(metaData, '[[foo#fragment]]{text}', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>text<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="foo".*?>/);
      expect(html.content).toMatch(/<span.*?data-fragment="fragment".*?>/);
    });

    it('[[repo:foo]]{text}', async () => {
      const html = await Markdown.parse(metaData, '[[repo:foo]]{text}', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>text<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="repo:foo".*?>/);
      expect(html.content).toMatch(/<span.*?data-repository-name="repo".*?>/);
    });

    it('[[repo:foo]]', async () => {
      const html = await Markdown.parse(metaData, '[[repo:foo]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>foo<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="repo:foo".*?>/);
      expect(html.content).toMatch(/<span.*?data-repository-name="repo".*?>/);
    });

    it('[[foo]]{text}', async () => {
      const html = await Markdown.parse(metaData, '[[foo]]{text}', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>text<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="foo".*?>/);
    });

    it('[[foo]]', async () => {
      const html = await Markdown.parse(metaData, '[[foo]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>foo<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="foo".*?>/);
    });

    it('/を含むときは末尾のものが表示される', async () => {
      const html = await Markdown.parse(metaData, '[[foo/bar]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>bar<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="foo\/bar".*?>/);
    });

    it('拡張子を表示しない', async () => {
      const html = await Markdown.parse(metaData, '[[foo.bar]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>foo<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="foo.bar".*?>/);
    });

    // TODO: そのうち対応する
    it('blockquote内では無効');

    it('code内では無効', async () => {
      const html = await Markdown.parse(metaData, '```\n[[foo]]\n```', manager);

      expect(html.content).toMatch(/[[foo]]/);
    });

    it('inlineCode内では無効', async () => {
      const html = await Markdown.parse(metaData, '`[[foo]]`', manager);

      expect(html.content).toMatch(/[[foo]]/);
    });

    it('リンク先が存在する場合、data-is-exist === true', async () => {
      const html = await Markdown.parse(metaData, '[[foo]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>foo<\/span>/);
      expect(html.content).toMatch(/<span.*?data-is-exist="true".*?>/);
    });

    it('リンク先が存在しない場合、data-is-exist === false', async () => {
      const html = await Markdown.parse(metaData, '[[hoge]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>hoge<\/span>/);
      expect(html.content).toMatch(/<span.*?data-is-exist="false".*?>/);
    });

    it('repositoryの指定がある場合、指定のrepositoryで検索する', async () => {
      let html = await Markdown.parse(metaData, '[[testRepo:foo]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>foo<\/span>/);
      expect(html.content).toMatch(/<span.*?data-is-exist="true".*?>/);

      html = await Markdown.parse(metaData, '[[testRepo:bar]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>bar<\/span>/);
      expect(html.content).toMatch(/<span.*?data-is-exist="false".*?>/);
    });
  });

  describe('inline link', () => {
    it('[[inline|repo:name#paragraph]]{text}', () => {
    });

    it('[[inline|repo:name#paragraph]]', () => {

    });
    it('[[inline|name#paragraph]]{text}', () => {

    });
    it('[[inline|name#paragraph]]', () => {

    });
    it('[[inline|repo:name]]{text}', () => {

    });
    it('[[inline|repo:name]]', () => {

    });
    it('[[inline|name]]{text}', () => {

    });
    it('[[inline|name]]', () => {

    });
    it('存在しないとき');
  });
});
