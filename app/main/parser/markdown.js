// @flow

import remark from 'remark';
import remarkHTML from 'remark-html';
// import remarkHTML from 'remark-vdom';
import remarkMarkdown from 'remark-parse';
import visit from 'unist-util-visit';
import is from 'unist-util-is';
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

const wikiLinkRegExp = /^\[\[(.+?)\]\]/;
const wikiLinkWithTextRegExp = /^\[\[(.+?)\]\]\{(.+?)\}/;
const splitFragmentRegExp = /(.+)#(.+)/;
const splitRepositoryNameRegExp = /(.+?):(.+)/;
const splitActionRegExp = /(.+?)\|(.+)/;

function replaceBamjuLink(options: {buffer: Buffer}) {
  // console.log('Parser', this.Parser);
  // console.log('Parser', this.Parser.prototype.blockMethods);
  // console.log('Parser', Object.keys(this.Parser.prototype));
  const Parser = this.Parser.prototype;

  Parser.inlineTokenizers.bamjuLink = inlineTokenizer;
  // console.log(Parser.inlineMethods);
  Parser.inlineMethods.splice(Parser.inlineMethods.indexOf('link'), 1);
  Parser.inlineMethods = [
    ...Parser.inlineMethods.slice(0, Parser.inlineMethods.indexOf('code') + 1),
    'bamjuLink',
    ...Parser.inlineMethods.slice(Parser.inlineMethods.indexOf('code') + 1),
  ];
  // console.log('1', Parser.inlineMethods);

  Parser.blockTokenizers.bamjuLink = blockTokenizer;
  Parser.blockMethods = [
    ...Parser.blockMethods.slice(0, Parser.blockMethods.indexOf('table') + 1),
    'bamjuLink',
    ...Parser.blockMethods.slice(Parser.blockMethods.indexOf('table') + 1),
  ];
  // console.log('Parser 2', this.Parser.prototype.blockMethods);

  inlineTokenizer.locator = locator;
  blockTokenizer.locator = locator;

  if (!(this.Compiler && this.Compiler.prototype.visitors)) {
    return;
  }

  this.Compiler.prototype.visitors.bamjuLink = (node) => {
    const data = node.data;
    return `[[${data.action}|${data.internalPath}#${data.fragment}]]{${data.aliasText}}`;
  };

  function locator(value, fromIndex) {
    return value.indexOf('[[', fromIndex);
  }

  function inlineTokenizer(eat, value) {
    const match = wikiLinkWithTextRegExp.exec(value) || wikiLinkRegExp.exec(value);
    if (!match) {
      return;
    }

    const linkInfo = parseBracket(match[0]);

    return eat(match[0])({
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
    });
  }

  function blockTokenizer(eat, value) {
    const match = wikiLinkWithTextRegExp.exec(value) || wikiLinkRegExp.exec(value);
    if (!match) {
      return;
    }

    const linkInfo = parseBracket(match[0]);
    if (linkInfo.action !== 'inline') {
      return;
    }

    return eat(match[0])({
      type: 'bamjuLink',
      action: linkInfo.action,
      value: linkInfo.aliasText,
      data: {
        ...linkInfo,
        headingDepth: 0,
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
    });
  }

  function parseBracket(text) {
    let bracket;
    let aliasText = '';
    let startIndex;
    let length;
    let itemName;
    let __;
    if (wikiLinkWithTextRegExp.test(text)) {
      const result = wikiLinkWithTextRegExp.exec(text);
      [__, bracket, aliasText] = result;
      itemName = bracket
        .replace(splitActionRegExp, '$2')
        .replace(splitFragmentRegExp, '$1')
        .replace(/.+:(.+)/, '$1');
      startIndex = result.index;
      length = result.input.length;
    } else {
      const result = wikiLinkRegExp.exec(text);
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
    }

    let fragment = '';
    if (splitFragmentRegExp.test(bracket)) {
      [__, bracket, fragment] = splitFragmentRegExp.exec(bracket);
    }
    let repositoryName = null;
    if (splitRepositoryNameRegExp.test(bracket)) {
      [__, repositoryName, __] = splitRepositoryNameRegExp.exec(bracket);
      repositoryName = repositoryName.replace(splitActionRegExp, '$2');
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

    return linkInfo;
  }

  function transformer(tree) {
    let depth = 0;
    tree.children.forEach((item) => {
      if (is('heading', item)) {
        depth = item.depth;
      }

      if (is('bamjuLink', item)) {
        // eslint-disable-next-line no-param-reassign
        item.data.headingDepth = depth;
      }
    });
  }

  return transformer;
}

function loadInlineLink(options: {buffer: Buffer, manager: RepositoryManager}) {
  const { buffer, manager } = options;

  return transformer;

  async function transformer(tree, file, next) {
    // console.log('loadInlineLink', tree.children);
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

    const [md, mes] = await metaData.getContent();
    if (isSimilarError(mes)) {
      // eslint-disable-next-line no-param-reassign
      node.hChildren.value = `[[inline|${node.data.internalPath}]]`;
    }

    let ast = {};
    const processor = remark()
      .use(remarkMarkdown, markdownOptions)
      .use(replaceBamjuLink, { buffer: metaData.toBuffer(), manager })
      .use(loadInlineLink, { buffer: metaData.toBuffer(), manager })
      .use(remarkHTML)
      .use(() => {
        return (t) => {
          ast = t;
        };
      });
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

  function match(node, _, parent) {
    return is('root', parent) && is('bamjuLink', node) && node.action === 'inline';
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
      .use(replaceBamjuLink, { buffer, manager })
      .use(loadInlineLink, { buffer, manager })
      .use(updateLinkStatus, { buffer, manager })
      .use(() => {
        return (tree) => {
          // console.log('spy', tree);
        };
      })
      .use(remarkHTML);
    const ret = await processor.process(md);

    return {
      content: String(ret)
    };
  }
}

export default Markdown;
