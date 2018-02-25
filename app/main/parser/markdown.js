// @flow

import fs from 'fs';

import remark from 'remark';
import remarkHTML from 'remark-html';
// import remarkHTML from 'remark-vdom';
import remarkMarkdown from 'remark-parse';
import reporter from 'vfile-reporter';
import visit from 'unist-util-visit';
import is from 'unist-util-is';
import path from '../../common/path';
import {
  // ItemTypeMarkdown,
  // ItemTypeText,
  // ItemTypeCSV,
  // ItemTypeTSV,
  MetaData,
  // type ParseResult,
  // type ParseResults,
  // internalPath,
} from '../../common/metadata';
import {
  RepositoryManager
} from '../../common/repository_manager';
import {
  type Buffer
} from '../../common/buffer';
import {
  isSimilarError,
  sleep,
  type $ReturnType,
} from '../../common/util';

export type MarkdownOption = {
};

type ParseResult = {
  content: string
};

// const defaultOption:MarkdownOption = {
//   gfm: true,
//   tables: true,
//   breaks: true,
//   renderer: undefined,
//   headingLevel: 0
// };

const markdownOptions = {
  gfm: true,
  footnotes: true,
  yaml: true
};

const wikiLinkRegExp = /\[\[(.+?)\]\]/;
const wikiLinkWithTextRegExp = /\[\[(.+?)\]\]\{(.+?)\}/;
const splitFragmentRegExp = /(.+)#(.+)/;
const splitRepositoryNameRegExp = /(.+?):(.+)/;
const splitActionRegExp = /(.+?)\|(.+)/;

function replaceLinkReference(_) {
  return transformer;

  function transformer(tree, __) {
    visit(tree, match, (node, index, parent) => {
      const text = `${parent.children[index - 1].value}[${node.children[0].value}]${parent.children[index + 1].value}`;
      const replaceNode = {
        type: 'text',
        value: text
      };

      parent.children = [].concat( // eslint-disable-line no-param-reassign
        parent.children.slice(0, index - 1),
        [replaceNode],
        parent.children.slice(index + 2, parent.children.length)
      );
    });
  }

  function match(node, index, parent) {
    if (parent == null) {
      return false;
    }
    if (index === 0 || parent.children.legnth < 3) {
      return false;
    }

    const prev = parent.children[index - 1];
    const next = parent.children[index + 1];
    if (prev == null || next == null) {
      return false;
    }

    const isMatchPrev = is('text', prev) && prev.value[prev.value.length - 1] === '[';
    const isMatchNext = is('text', next) && next.value[0] === ']';

    return isMatchPrev && isMatchNext && is('linkReference', node);
  }
}

function replaceBamjuLink(options: {buffer: Buffer}) {
  return transformer;

  function transformer(tree, _) {
    visit(tree, match, (node, index, parent) => {
      if (!wikiLinkRegExp.test(node.value)) {
        return;
      }

      let bracket;
      let aliasText = '';
      let startIndex;
      let length;
      let itemName;
      let __;
      if (wikiLinkWithTextRegExp.test(node.value)) {
        const result = wikiLinkWithTextRegExp.exec(node.value);
        [__, bracket, aliasText] = result;
        itemName = bracket
          .replace(splitActionRegExp, '$2')
          .replace(splitFragmentRegExp, '$1')
          .replace(/.+:(.+)/, '$1');
        startIndex = result.index;
        length = result.input.length;
      } else if (wikiLinkRegExp.test(node.value)) {
        const result = wikiLinkRegExp.exec(node.value);
        [__, bracket] = result;
        startIndex = result.index;
        itemName = bracket
          .replace(splitActionRegExp, '$2')
          .replace(splitFragmentRegExp, '$1')
          .replace(/.+:(.+)/, '$1');
        aliasText = itemName
          .replace(splitRepositoryNameRegExp, '$2')
          .replace(/.+\/(.+?)/, '$1')
          .replace(/(.+?)\..+/, '$1');
        length = result.input.length;
      } else {
        return;
      }

      let fragment = '';
      if (splitFragmentRegExp.test(bracket)) {
        [__, bracket, fragment] = splitFragmentRegExp.exec(bracket);
      }
      let repositoryName = null;
      if (splitRepositoryNameRegExp.test(bracket)) {
        [__, repositoryName, __] = splitRepositoryNameRegExp.exec(bracket);
      }
      let action = 'link';
      if (splitActionRegExp.test(bracket)) {
        [__, action, bracket] = splitActionRegExp.exec(bracket);
      }

      const linkInfo = {
        internalPath: bracket,
        aliasText,
        startIndex,
        length,
        itemName,
        repositoryName,
        fragment,
        action,
        parentMetaDataID: options.buffer.id,
      };

      replaceLink(node, index, parent, linkInfo);
    });

    let headingDepth = 0;
    tree.children.forEach((__, i) => {
      if (is('heading', tree.children[i])) {
        headingDepth = tree.children[i].depth;
      }
      if (!is('paragraph', tree.children[i])) {
        return;
      }

      const inlineLink = tree.children[i].children.find((item) => {
        return item.type === 'bamjuLink' && item.action === 'inline';
      });
      if (inlineLink == null) {
        return;
      }

      inlineLink.data.headingDepth = headingDepth;

      // eslint-disable-next-line
      tree.children[i] = inlineLink;
    });
  }

  function match(node, index, parent) {
    return (node.type === 'text') && (
      !is('blockquote', parent)
      && !is('code', parent)
      && !is('inlineCode', parent)
    );
  }

  function replaceLink(node, index, parent, linkInfo) {
    parent.children = [].concat( // eslint-disable-line no-param-reassign
      parent.children.slice(0, index - 1),
      [
        {
          type: 'text',
          value: node.value.slice(0, linkInfo.startIndex)
        }, {
          type: 'bamjuLink',
          action: linkInfo.action,
          value: linkInfo.aliasText,
          data: {
            ...linkInfo,
            hName: 'span',
            hProperties: {
              className: 'bamjuLink',
              dataInternalPath: linkInfo.internalPath,
              dataFragment: linkInfo.fragment,
              dataRepositoryName: linkInfo.repositoryName,
            },
            hChildren: [{
              type: 'text',
              value: linkInfo.aliasText
            }]
          }
        }, {
          type: 'text',
          value: node.value.slice(linkInfo.startIndex + linkInfo.length)
        }
      ],
      parent.children.slice(index + 1, parent.children.length),
    );
  }
}

function loadInlineLink(options: {buffer: Buffer, manager: RepositoryManager}) {
  const { buffer, manager } = options;

  return transformer;

  async function transformer(tree, file, next) {
    const pp = tree.children.reduce((r, __, i) => {
      return r.concat(applyChildren(tree.children[i], i, tree, replace));
    }, []);
    await Promise.all(pp);

    next(null, tree, file);
    return tree;
  }

  async function replace(node, index, parent) {
    if (!match(node, index, parent)) {
      return;
    }

    const repositoryName = node.data.repositoryName || buffer.repositoryName;
    const metaData = manager.detect(repositoryName, node.data.internalPath, new MetaData(buffer));
    if (metaData == null) {
      // eslint-disable-next-line no-param-reassign
      parent.children[index] = {
        type: 'paragraph',
        children: [{
          type: 'bamjuLink',
          action: 'link',
          data: {
            ...node.data,
            hName: 'span',
            hProperties: {
              className: 'bamjuLink',
              dataInternalPath: node.data.internalPath,
              dataFragment: node.data.fragment,
              dataRepositoryName: node.data.repositoryName,
              dataIsExist: false,
            },
            hChildren: [{
              type: 'text',
              value: `[[inline|${node.data.internalPath}]]`
            }]
          }
        }]
      };
      return;
    }

    let ast = {};
    const processor = remark()
      .use(remarkMarkdown, markdownOptions)
      .use(replaceLinkReference, { buffer: metaData.toBuffer(), manager })
      .use(replaceBamjuLink, { buffer: metaData.toBuffer(), manager })
      .use(loadInlineLink, { buffer: metaData.toBuffer(), manager })
      .use(() => {
        return (t) => {
          ast = t;
        };
      });

    let md = '';
    try {
      md = fs.readFileSync(metaData.absolutePath, 'utf8');
    } catch (e) {
      // eslint-disable-next-line no-param-reassign
      node.hChildren.value = `[[inline|${node.data.internalPath}]]`;
      return;
    }
    await processor.process(md);

    ast.children.forEach((item) => {
      if (!is('heading', item)) {
        return;
      }

      if (item.depth === 1) {
        // eslint-disable-next-line no-param-reassign
        item.children = [{
          type: 'bamjuLink',
          action: 'link',
          data: {
            ...node.data,
            hName: 'span',
            hProperties: {
              className: 'bamjuLink',
              dataInternalPath: node.data.internalPath,
              dataFragment: node.data.fragment,
              dataRepositoryName: node.data.repositoryName,
            },
            hChildren: [{
              type: 'text',
              value: node.data.aliasText
            }]
          }
        }];
      }

      // eslint-disable-next-line no-param-reassign
      item.depth += node.data.headingDepth;
    });

    // eslint-disable-next-line no-param-reassign
    parent.children = [
      ...parent.children.slice(0, index),
      ...ast.children,
      ...parent.children.slice(index + 1, parent.children.length)
    ];
  }

  function match(node, _, __) {
    return is('bamjuLink', node) && node.action === 'inline';
  }
}

// eslint-disable-next-line flowtype/no-weak-types
function applyChildren<N:Object, R, Fn:(N, number, N) => Promise<R>>(node: N, index: number, parent: N, fn: Fn): Promise<R>[] {
  let ret = [fn(node, index, parent)];

  if (node.children != null) {
    ret = node.children.reduce((r, _, i) => {
      return r.concat(applyChildren(node.children[i], i, node, fn));
    }, ret);
  }

  return ret;
}

function updateLinkStatus(options: {buffer: Buffer, manager: RepositoryManager}) {
  const { buffer, manager } = options;

  function transformer(tree, _) {
    visit(tree, match, (node, __, ___) => {
      const repositoryName = node.data.repositoryName || buffer.repositoryName;
      const metaData = manager.detect(repositoryName, node.data.internalPath, new MetaData(buffer));

      // eslint-disable-next-line no-param-reassign
      node.data.isExist = node.data.hProperties.dataIsExist = metaData != null;
    });
  }

  function match(node) {
    return is('bamjuLink', node) && node.action === 'link';
  }

  return transformer;
}


export class Markdown {
  static async parse(buffer: Buffer, md: string, manager: RepositoryManager): Promise<ParseResult> {
    const processor = remark()
      .use(remarkMarkdown, markdownOptions)
      .use(replaceLinkReference, { buffer, manager })
      .use(replaceBamjuLink, { buffer, manager })
      .use(loadInlineLink, { buffer, manager })
      .use(updateLinkStatus, { buffer, manager })
      .use(remarkHTML);
    const ret = await processor.process(md);

    return {
      content: String(ret)
    };
  }
}

export default Markdown;
