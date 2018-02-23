// @flow

import remark from 'remark';
import remarkHTML from 'remark-html';
// import remarkHTML from 'remark-vdom';
import remarkMarkdown from 'remark-parse';
import reporter from 'vfile-reporter';
import visit from 'unist-util-visit';
import is from 'unist-util-is';
import path from '../../common/path';
// import {
//   ItemTypeMarkdown,
//   ItemTypeText,
//   ItemTypeCSV,
//   ItemTypeTSV,
//   MetaData,
//   type ParseResult,
//   type ParseResults,
//   internalPath,
// } from '../../common/metadata';
import {
  RepositoryManager
} from '../../common/repository_manager';
import {
  type Buffer
} from '../../common/buffer';
// import {
//   type Message,
//   MessageTypeSucceeded,
// } from '../../common/util';

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

function wikiLinkPlugin(options: Object = {}) {
  return (tree, file) => {
    if (tree == null || file == null) {
      return;
    }

    visit(tree, match, (node, index, parent) => {
      // console.log('visit', options);
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
        itemName = bracket.replace(/.+:(.+)/, '$1');
        startIndex = result.index;
        length = result.input.length;
      } else if (wikiLinkRegExp.test(node.value)) {
        const result = wikiLinkRegExp.exec(node.value);
        [__, bracket] = result;
        startIndex = result.index;
        itemName = bracket.replace(/.+:(.+)/, '$1');
        aliasText = bracket
          .replace(splitActionRegExp, '$2')
          .replace(splitRepositoryNameRegExp, '$2')
          .replace(splitFragmentRegExp, '$1')
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

      const manager = options.manager;
      const buffer = options.buffer;

      const metaData = manager.detect(repositoryName || buffer.repositoryName, itemName);
      const isExist = metaData != null;

      const linkInfo = {
        internalPath: bracket,
        aliasText,
        startIndex,
        length,
        itemName,
        repositoryName,
        fragment,
        action,
        isExist,
      };

      switch (action) {
      case 'link': {
        replaceLink(node, index, parent, linkInfo);
        break;
      }
      case 'inline': {
        break;
      }
      default:
      }

      // console.log(parent.children);
    });
  };

  function replaceLink(node, index, parent, linkInfo) {
    parent.children = [].concat( // eslint-disable-line no-param-reassign
      parent.children.slice(0, index - 1),
      [
        {
          type: 'text',
          value: node.value.slice(0, linkInfo.startIndex)
        }, {
          type: 'bamjuLink',
          value: linkInfo.aliasText,
          data: {
            hName: 'span',
            hProperties: {
              className: 'bamjuLink',
              dataInternalPath: linkInfo.internalPath,
              dataFragment: linkInfo.fragment,
              dataRepositoryName: linkInfo.repositoryName,
              dataIsExist: linkInfo.isExist,
              onClick: ''
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

  function replaceInline() {

  }
}

function match(node, index, parent) {
  // console.log('match node', node);
  // console.log('match index', index);
  // console.log('match parent', parent);

  return (node.type === 'text') && (
    !is('blockquote', parent)
    && !is('code', parent)
    && !is('inlineCode', parent)
  );
}

function isMatchLinkReference(node, index, parent) {
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
  // console.log('isMatchLinkReference next', next);
  const isMatchNext = is('text', next) && next.value[0] === ']';

  return isMatchPrev && isMatchNext && is('linkReference', node);
}

function replaceLinkReference() {
  return (tree, _) => {
    visit(tree, null, (node, index, parent) => {
      if (!isMatchLinkReference(node, index, parent)) {
        return;
      }

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
  };
}


export class Markdown {
  static async parse(buffer: Buffer, md: string, manager: RepositoryManager): Promise<ParseResult> {
    const processor = remark()
      .use(remarkMarkdown, markdownOptions)
      .use(replaceLinkReference)
      .use(wikiLinkPlugin, { buffer, manager })
      .use(remarkHTML);
    const ret = await processor.process(md);

    return {
      content: String(ret)
    };
  }
}

export default Markdown;
