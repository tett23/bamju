// @flow

import remark from 'remark';
import remarkHTML from 'remark-html';
// $FlowFixMe
import remarkMarkdown from 'remark-parse';
import remarkBreaks from 'remark-breaks';
import Bluebird from 'bluebird';
import {
  MetaData,
} from '../../common/metadata';
import {
  RepositoryManager
} from '../../common/repository_manager';
import {
  type Buffer
} from '../../common/buffer';
import {
  isSimilarError,
} from '../../common/message';

export type MarkdownOption = {
};

type ParseResult = {
  content: string
};

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
  const Parser = this.Parser.prototype;

  Parser.inlineTokenizers.bamjuLink = inlineTokenizer;
  Parser.inlineMethods.splice(Parser.inlineMethods.indexOf('link'), 1);
  Parser.inlineMethods = [
    ...Parser.inlineMethods.slice(0, Parser.inlineMethods.indexOf('code') + 1),
    'bamjuLink',
    ...Parser.inlineMethods.slice(Parser.inlineMethods.indexOf('code') + 1),
  ];

  Parser.blockTokenizers.bamjuLink = blockTokenizer;
  Parser.blockMethods = [
    ...Parser.blockMethods.slice(0, Parser.blockMethods.indexOf('table') + 1),
    'bamjuLink',
    ...Parser.blockMethods.slice(Parser.blockMethods.indexOf('table') + 1),
  ];

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
      if (item.type === 'heading') {
        depth = item.depth;
      }

      if (item.type === 'bamjuLink') {
        // eslint-disable-next-line no-param-reassign
        item.data.headingDepth = depth;
      }
    });
  }

  return transformer;
}

function loadInlineLink(options: {buffer: Buffer, manager: RepositoryManager, inlineStack: string[] }) {
  const { buffer, manager, inlineStack } = options;

  return transformer;

  async function transformer(tree, file, next) {
    const benchID1 = `1 markdown.loadInlineLink ${buffer.repositoryName} ${buffer.path}`;
    if (process.env.NODE_EVN === 'development')console.time(benchID1);
    const pp = [];
    tree.children.forEach((__, i) => {
      pp.push(replace(tree.children[i], i, tree));
    });
    if (process.env.NODE_EVN === 'development')console.timeEnd(benchID1);
    const benchID2 = `2 markdown.loadInlineLink ${buffer.repositoryName} ${buffer.path}`;
    if (process.env.NODE_EVN === 'development')console.time(benchID2);
    await Promise.all(pp);
    if (process.env.NODE_EVN === 'development')console.timeEnd(benchID2);

    next(null, tree, file);
    return tree;
  }

  async function replace(node, index, parent) {
    if (!match(node, index, parent)) {
      return;
    }

    if (inlineStack.includes(node.data.internalPath)) {
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
              value: `!loop [[inline|${node.data.internalPath}]]`
            }]
          }
        }]
      };
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
      .use(remarkBreaks)
      .use(replaceBamjuLink, { buffer: metaData.toBuffer(), manager })
      .use(loadInlineLink, { buffer: metaData.toBuffer(), manager, inlineStack: inlineStack.concat([node.data.internalPath]) })
      .use(() => {
        return (t) => {
          ast = t;
        };
      });
    await processor.process(md);

    ast.children.forEach((item) => {
      if (item.type !== 'heading') {
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

    const idx = parent.children.findIndex((item) => {
      return item.type === 'bamjuLink' && item.value === node.value;
    });
    // eslint-disable-next-line no-param-reassign
    parent.children = [
      ...parent.children.slice(0, idx),
      ...ast.children,
      ...parent.children.slice(idx + 1)
    ];
  }

  function match(node, _, parent) {
    return parent.type === 'root' && node.type === 'bamjuLink' && node.action === 'inline';
  }
}

// eslint-disable-next-line flowtype/no-weak-types
function applyChildren<
  N:Object,
  R,
  Fn:(
    N, number, N
  ) => Promise<R>
>(
  node: N,
  index: number,
  parent: N,
  fn: Fn,
  init: Promise<R>[] = []
) {
  // eslint-disable-next-line
  // const benchID = `applyChildren ${node.type} children=${node.children ? node.children.length : 0} ${node.data ? node.data.internalPath : ''} ${Math.random()}`;
  // console.time(benchID);
  init.push(fn(node, index, parent));

  if (node.children == null) {
    // console.timeEnd(benchID);
    return;
  }

  const len = node.children.length;
  for (let i = 0; i < len; i += 1) {
    // eslint-disable-next-line
    applyChildren(node.children[i], i, node, fn, init);
  }
  // eslint-disable-next-line
  // console.timeEnd(benchID);
}

function updateLinkStatus(options: {buffer: Buffer, manager: RepositoryManager}) {
  const { buffer, manager } = options;

  return (tree, file, next) => {
    return new Bluebird((resolve, reject) => {
      transformer(tree, file, next).then((r) => {
        resolve(r);
        next(null, tree);
        return r;
      }).catch((err) => {
        reject(err);
        next(Error(err));
      });
    });
  };

  function transformer(tree, _, __) {
    return new Bluebird((resolve, reject) => {
      const benchID1 = `1 markdown.updateLinkStatus ${buffer.repositoryName} ${buffer.path}`;
      const benchID2 = `2 markdown.updateLinkStatus ${buffer.repositoryName} ${buffer.path}`;
      if (process.env.NODE_EVN === 'development') console.time(benchID1);
      const replacePromises = [];
      const len = tree.children.length;
      const pp = [];
      for (let i = 0; i < len; i += 1) {
        pp.push(applyChildren(tree.children[i], i, tree, replace, replacePromises));
      }
      Bluebird.all(pp).then((r) => {
        if (process.env.NODE_EVN === 'development')console.timeEnd(benchID1);
        if (process.env.NODE_EVN === 'development')console.time(benchID2);
        Bluebird.all(replacePromises).then((rr) => {
          if (process.env.NODE_EVN === 'development')console.timeEnd(benchID2);

          resolve(rr);
          return rr;
        }).catch((err) => {
          console.log('err replacePromises', err);
          reject(err);
        });
        return r;
      }).catch((err) => {
        console.log('err pp', err);
        reject(err);
      });
    });
  }

  async function replace(node, index, parent): Promise<void> {
    if (!match(node, index, parent)) {
      return;
    }

    const repositoryName = node.data.repositoryName || buffer.repositoryName;
    const metaData = manager.detect(repositoryName, node.data.internalPath, new MetaData(buffer));

    if (metaData) {
      // eslint-disable-next-line no-param-reassign
      node.data.metaDataID = node.data.hProperties.dataMetaDataId = metaData.id;
    }
    // eslint-disable-next-line no-param-reassign
    node.data.isExist = node.data.hProperties.dataIsExist = metaData != null;
  }

  function match(node, _, __) {
    return node.type === 'bamjuLink' && node.action === 'link';
  }
}


export class Markdown {
  static async parse(buffer: Buffer, md: string, manager: RepositoryManager, inlineStack: string[] = []): Promise<ParseResult> {
    const processor = remark()
      .use(remarkMarkdown, markdownOptions)
      .use(remarkBreaks)
      .use(replaceBamjuLink, { buffer, manager })
      .use(loadInlineLink, { buffer, manager, inlineStack })
      .use(updateLinkStatus, { buffer, manager })
      .use(remarkHTML);
    const ret = await processor.process(md);

    return {
      content: String(ret)
    };
  }
}

export default Markdown;
