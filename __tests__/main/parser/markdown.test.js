// @flow

import fs from 'fs';

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
      'foo.md'
    ]
  });

  manager = new RepositoryManager(buffers, [{
    repositoryName: 'test',
    absolutePath: '/tmp/bamju/test'
  }, {
    repositoryName: 'testRepo',
    absolutePath: '/tmp/bamju/testRepo'
  }]);

  fs.writeFileSync('/tmp/bamju/test/foo/bar/baz/testItem.md', '# testItem');
  fs.writeFileSync('/tmp/bamju/testRepo/foo.md', '# foo');

  // $FlowFixMe
  metaData = manager.find('test').getItemByPath('/foo/bar/baz/testItem.md');
});

describe('Markdown', () => {
  describe('wiki link', () => {
    it('[[repo:foo#fragment]]{text}', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[repo:foo#fragment]]{text}', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>text<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="repo:foo".*?>/);
      expect(html.content).toMatch(/<span.*?data-repository-name="repo".*?>/);
      expect(html.content).toMatch(/<span.*?data-fragment="fragment".*?>/);
    });

    it('[[repo:foo#fragment]]', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[repo:foo#fragment]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>foo<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="repo:foo".*?>/);
      expect(html.content).toMatch(/<span.*?data-repository-name="repo".*?>/);
      expect(html.content).toMatch(/<span.*?data-fragment="fragment".*?>/);
    });

    it('[[foo#fragment]]{text}', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[foo#fragment]]{text}', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>text<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="foo".*?>/);
      expect(html.content).toMatch(/<span.*?data-fragment="fragment".*?>/);
    });

    it('[[repo:foo]]{text}', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[repo:foo]]{text}', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>text<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="repo:foo".*?>/);
      expect(html.content).toMatch(/<span.*?data-repository-name="repo".*?>/);
    });

    it('[[repo:foo]]', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[repo:foo]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>foo<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="repo:foo".*?>/);
      expect(html.content).toMatch(/<span.*?data-repository-name="repo".*?>/);
    });

    it('[[foo]]{text}', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[foo]]{text}', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>text<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="foo".*?>/);
    });

    it('[[foo]]', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[foo]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>foo<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="foo".*?>/);
    });

    it('[[link|foo]]', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[link|foo]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>foo<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="foo".*?>/);
    });

    it('/を含むときは末尾のものが表示される', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[foo/bar]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>bar<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="foo\/bar".*?>/);
    });

    it('拡張子を表示しない', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[foo.bar]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>foo<\/span>/);
      expect(html.content).toMatch(/<span.*?data-internal-path="foo.bar".*?>/);
    });

    it('連続したリンクを解釈できる', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[foo]]bar[[baz]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>foo<\/span>/);
      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>baz<\/span>/);
    });

    // TODO: そのうち対応する
    it('blockquote内では無効');

    it('code内では無効', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '```\n[[foo]]\n```', manager);

      expect(html.content).toMatch(/[[foo]]/);
    });

    it('inlineCode内では無効', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '`[[foo]]`', manager);

      expect(html.content).toMatch(/[[foo]]/);
    });

    it('リンク先が存在する場合、data-is-exist === true', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[foo]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>foo<\/span>/);
      expect(html.content).toMatch(/<span.*?data-is-exist="true".*?>/);
    });

    it('リンク先が存在しない場合、data-is-exist === false', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[hoge]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>hoge<\/span>/);
      expect(html.content).toMatch(/<span.*?data-is-exist="false".*?>/);
    });

    it('repositoryの指定がある場合、指定のrepositoryで検索する', async () => {
      let html = await Markdown.parse(metaData.toBuffer(), '[[testRepo:foo]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>foo<\/span>/);
      expect(html.content).toMatch(/<span.*?data-is-exist="true".*?>/);

      html = await Markdown.parse(metaData.toBuffer(), '[[testRepo:bar]]', manager);

      expect(html.content).toMatch(/<span.*class="bamjuLink".*?>bar<\/span>/);
      expect(html.content).toMatch(/<span.*?data-is-exist="false".*?>/);
    });
  });

  describe('inline link', () => {
    it('[[inline|repo:name#paragraph]]{text}', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[inline|testRepo:foo]]{text}', manager);

      expect(html.content).toMatch(/<h1.*?>.*?text.*?<\/h1>/);
    });

    it('[[inline|repo:name#paragraph]]', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[inline|testRepo:foo#paragraph]]', manager);

      expect(html.content).toMatch(/<h1.*?>.*?foo.*?<\/h1>/);
    });

    it('[[inline|name#paragraph]]{text}', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[inline|testItem#paragraph]]{text}', manager);

      expect(html.content).toMatch(/<h1.*?>.*?text.*?<\/h1>/);
    });

    it('[[inline|name#paragraph]]', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[inline|testItem#paragraph]]', manager);

      expect(html.content).toMatch(/<h1.*?>.*?testItem.*?<\/h1>/);
    });
    it('[[inline|repo:name]]{text}', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[inline|testRepo:foo]]{text}', manager);

      expect(html.content).toMatch(/<h1.*?>.*?text.*?<\/h1>/);
    });

    it('[[inline|repo:name]]', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[inline|testRepo:foo]]', manager);

      expect(html.content).toMatch(/<h1.*?>.*?foo.*?<\/h1>/);
    });

    it('[[inline|name]]{text}', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[inline|testItem]]{text}', manager);

      expect(html.content).toMatch(/<h1.*?>.*?text.*?<\/h1>/);
    });

    it('[[inline|name]]', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[inline|testItem]]', manager);

      expect(html.content).toMatch(/<h1.*?>.*?testItem.*?<\/h1>/);
    });

    it('heading深さの引きつぎ', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), `# heading

[[inline|testItem]]
`, manager);

      expect(html.content).toMatch(/<h2.*?>.*?testItem.*?<\/h2>/);
    });

    it('inlineが再帰したときは!loopと表示する', async () => {
      // $FlowFixMe
      await manager.find('test').addFile('/loopTest.md', '[[inline|loopTest]]');
      const html = await Markdown.parse(metaData.toBuffer(), '[[inline|loopTest]]', manager);

      expect(html.content).toMatch('!loop [[inline|loopTest]]');
    });

    it('読みこんだファイルのh1が自身のリンクになる', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[inline|testItem]]', manager);

      expect(html.content).toMatch(/<h1.*?>.*?testItem.*?<\/h1>/);
      expect(html.content).toMatch(/<h1.*?><span.*class="bamjuLink".*?>testItem<\/span><\/h1>/);
    });

    it('存在しないとき', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[inline|not exist]]', manager);

      expect(html.content).not.toMatch(/<h1.*?>.*?not exist.*?<\/h1>/);
      expect(html.content).toMatch(/<span.*class="bamjuLink".*?data-is-exist="false".*?>\[\[inline\|not exist\]\]<\/span>/);
    });

    it('ディレクトリの読みこみ', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[inline|/]]', manager);

      expect(html.content).not.toMatch(/<h1.*?>.*?test:\/.*?<\/h1>/);
      expect(html.content).toMatch(/<span.*class="bamjuLink".*?data-is-exist="true".*?>foo<\/span>/);
    });

    it('連続したリンクを解釈できる', async () => {
      const html = await Markdown.parse(metaData.toBuffer(), '[[inline|foo]]\n[[inline|bar]]', manager);

      expect(html.content).toMatch(/<h1.*?>.*?foo.*?<\/h1>/);
      expect(html.content).toMatch(/<h1.*?>.*?bar.*?<\/h1>/);
    });

    it('何らかの理由でファイルが存在しない場合は赤リンクになる');
  });
});
