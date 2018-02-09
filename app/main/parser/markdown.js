/* eslint no-await-in-loop:0, no-plusplus: 0, func-names: 0, flowtype-errors/show-errors: 0, prefer-const: 0 */
// @flow

import marked from 'marked';
import path from '../../common/path';
import {
  ItemTypeMarkdown,
  ItemTypeText,
  ItemTypeCSV,
  ItemTypeTSV,
  MetaData,
  type ParseResult,
  type ParseResults,
  internalPath,
} from '../../common/metadata';
import {
  getInstance,
} from '../../common/repository_manager';
import {
  type Message,
  MessageTypeSucceeded,
} from '../../common/util';
import {
  type Parser,
  type StackItem,
  type StackItems,
} from './parser';

const { markedParserTok, markedLexerToken } = require('./marked_overrides');

export type MarkdownOption = {
  gfm?: boolean,
  tables?: boolean,
  breaks?: boolean,
  pedantic?: boolean,
  sanitize?: boolean,
  sanitizer?: (string)=>string,
  mangle?: boolean,
  smartLists?: boolean,
  silent?: boolean,
  highlight?: (string, string, (Error, number)=>void) => string,
  langPrefix?: string,
  smartypants?: boolean,
  headerPrefix?: string,
  renderer?: marked.Renderer,
  xhtml?: boolean,

  headingLevel?: number
};

type Token = Object; /* eslint flowtype/no-weak-types: 0 */

const defaultOption:MarkdownOption = {
  gfm: true,
  tables: true,
  breaks: true,
  renderer: undefined,
  headingLevel: 0
};

type ParseInlineToken = {
  repo: string,
  name: string,
  fragment: ?string,
  text: ?string
};

export class Markdown implements Parser<MarkdownOption> {
  static async parse(metaData: MetaData, md: string, stack: StackItems = [], opt: MarkdownOption = {}): Promise<ParseResult> {
    if (md === '') {
      return emptyFileBuffer();
    }

    const options = Object.assign({}, defaultOption, opt);
    stack.push({ repositoryName: metaData.repositoryName, absolutePath: metaData.absolutePath });

    const renderer:marked.Renderer = new marked.Renderer(options);
    options.renderer = opt.renderer || renderer;
    renderer.inlineLink = renderInlineLink;
    const lexer:marked.Lexer = new marked.Lexer(options);
    lexer.rules.inlineLink1 = /^\s*\[\[inline\|(.+?):(.+?)#(.+?)\]\]\{(.+?)\}/;
    lexer.rules.inlineLink2 = /^\s*\[\[inline\|(.+?):(.+?)#(.+?)\]\]/;
    lexer.rules.inlineLink3 = /^\s*\[\[inline\|(.+?)#(.+?)\]\]\{(.+?)\}/;
    lexer.rules.inlineLink4 = /^\s*\[\[inline\|(.+?)#(.+?)\]\]/;
    lexer.rules.inlineLink5 = /^\s*\[\[inline\|(.+?):(.+?)\]\]\{(.+?)\}/;
    lexer.rules.inlineLink6 = /^\s*\[\[inline\|(.+?):(.+?)\]\]/;
    lexer.rules.inlineLink7 = /^\s*\[\[inline\|(.+?)\]\]\{(.+?)\}/;
    lexer.rules.inlineLink8 = /^\s*\[\[inline\|(.+?)\]\]/;
    lexer.token = markedLexerToken;
    const parser:marked.Parser = new marked.Parser(options);
    parser.tok = markedParserTok;
    const children:ParseResults = [];
    let currentHeadingLevel:number = 0;
    const tokens:Array<Token> = await Promise.all(lexer.lex(md).map(async (tok: Token): Token => {
      const ret = tok;
      if (ret.type === 'heading') {
        ret.depth += options.headingLevel;
        currentHeadingLevel = ret.depth - 1;
        if (currentHeadingLevel === 0) {
          currentHeadingLevel = 1;
        }
      }
      if (ret.type === 'inlineLink') {
        ret.repo = ret.repo || metaData.repositoryName;
        const result:ParseResult = await Markdown.parseInline(ret, currentHeadingLevel, stack, path.dirname(metaData.path));
        children.push(result);

        ret.html = result.content;
      }

      return ret;
    }));
    tokens.links = {};
    // console.log('Markdown.parse', tokens);

    const parsed:string = parser.parse(tokens);

    const p5 = async (html: string): Promise<string> => {
      let ret:string = html;

      let re:RegExp = /\[\[(?!inline\|)([^{[\]]+?):([^{[\]]+?)\]\]\{(.+?)\}/;
      while (re.test(ret)) {
        ret = ret.replace(re, (_, r: string, name: string, text: string): string => {
          return Markdown.wikiLinkReplacer(r, name, text, path.dirname(metaData.path));
        });
      }

      re = /\[\[(?!inline\|)([^{[\]]+?):([^{[\]]+?)\]\]/;
      while (re.test(ret)) {
        ret = ret.replace(re, (_, r: string, name: string): string => {
          return Markdown.wikiLinkReplacer(r, name, name, path.dirname(metaData.path));
        });
      }

      re = /\[\[(?!inline\|)([^{[\]]+?):(.+?)\]\]/;
      while (re.test(ret)) {
        ret = ret.replace(re, (_, repo: string, name: string): string => {
          return Markdown.wikiLinkReplacer(repo, name, name, path.dirname(metaData.path));
        });
      }

      re = /\[\[(?!inline\|)([^{[\]]+?)\]\]\{(.+?)\}/;
      while (re.test(ret)) {
        ret = ret.replace(re, (_, name: string, text: string): string => {
          return Markdown.wikiLinkReplacer(metaData.repositoryName, name, text, path.dirname(metaData.path));
        });
      }

      re = /\[\[(?!inline\|)([^{[\]]+?)\]\]/;
      while (re.test(ret)) {
        ret = ret.replace(re, (_, name: string): string => {
          return Markdown.wikiLinkReplacer(metaData.repositoryName, name, name, path.dirname(metaData.path));
        });
      }

      return ret;
    };

    const html:string = await Promise.resolve(parsed)
      .then(p5);

    return {
      content: html,
      children,
    };
  }

  static wikiLinkReplacer(repo: string, name: string, text: string, dirname: string): string {
    const isExist:boolean = Markdown.isExistPage(repo, name);

    return linkString(repo, name, text, dirname, isExist);
  }

  static async parseInline(token: ParseInlineToken, headingLevel: number = 1, stack: StackItems, dirname: string): Promise<ParseResult> {
    const metaData:?MetaData = getInstance().detect(token.repo, token.name);
    if (!metaData) {
      return inlineNotFoundBuffer(token, dirname);
    }

    const { itemType } = metaData;
    let ret:ParseResult = { content: '', children: [] };
    if (itemType === ItemTypeCSV || itemType === ItemTypeTSV) {
      const [r, message] = await metaData.parse();
      if (r != null) {
        ret = r;
      }
      if (message.type !== MessageTypeSucceeded) {
        ret.content = message.message;
      }
    } else if (itemType === ItemTypeMarkdown || itemType === ItemTypeText) {
      ret = await parseChild(metaData, token, headingLevel, stack);
    } else {
      const [r, message] = await metaData.parse();
      if (r != null) {
        ret = r;
      }
      if (message.type !== MessageTypeSucceeded) {
        ret.content = message.message;
      }
    }

    return ret;
  }

  static checkInlineLoop(metaData: MetaData, stackItems: StackItems): boolean {
    let ret:boolean = false;

    stackItems.forEach((stackItem: StackItem) => {
      if (stackItem.repositoryName === metaData.repositoryName && stackItem.absolutePath === metaData.absolutePath) {
        ret = true;
      }
    });

    return ret;
  }

  static isExistPage(repo: string, name: string): boolean {
    const p:?MetaData = getInstance().detect(repo, name);
    return p != null;
  }
}

function linkString(repo: string, name: string, text: string, dirname: string, isExist: boolean): string {
  let availableClass:string;
  let onClickString:string;
  if (isExist) {
    onClickString = `wikiLinkOnClickAvailable('${repo}', '${name}')`;
    availableClass = 'available';
  } else {
    availableClass = 'unavailable';

    let formValue:string;
    if (path.isAbsolute(name)) {
      formValue = `${repo}:${name}.md`;
    } else {
      formValue = `${repo}:${path.join('/', dirname, name)}.md`;
    }

    onClickString = `wikiLinkOnClickUnAvailable('${repo}', '${formValue}')`;
  }

  return `<span class="wikiLink ${availableClass}" onClick="${onClickString}">${text}</span>`;
}

function renderInlineLink(html: string): string {
  return `<div>${html}</div>`;
}

async function parseChild(metaData, token: ParseInlineToken, headingLevel = 1, stack: StackItems): Promise<ParseResult> {
  const {
    repo, name, text
  } = token;

  let altText:string = !text ? `${metaData.internalPath()}` : text;
  altText = `{${altText}}`;

  // ループしていると壊れるので
  if (Markdown.checkInlineLoop(metaData, stack)) {
    return loopBuffer(metaData, altText);
  }

  let message:Message;
  let md = '';
  [md, message] = await metaData.getContent();
  if (message.type !== MessageTypeSucceeded) {
    return {
      content: `error: ${message.message}`,
      children: []
    };
  }

  // h1のおきかえ
  md = md.replace(/^#\s*(.+)$/m, `# [[${internalPath(repo, metaData.path)}]]{${text || name}}`);

  const ret = await Markdown.parse(metaData, md, stack, { headingLevel });

  return ret;
}

function emptyFileBuffer(): ParseResult {
  return {
    content: '(empty file)',
    children: []
  };
}

function inlineNotFoundBuffer(token: ParseInlineToken, dirname: string): ParseResult {
  const {
    repo, name, fragment
  } = token;

  const linkText = `[[inline|${internalPath(repo, name)}${fragment ? `#${fragment}` : ''}]]`;
  const body = linkString(repo, name, linkText, dirname, false);

  return {
    content: body,
    children: []
  };
}

function loopBuffer(metaData: MetaData, altText: string): ParseResult {
  return {
    content: `!loop [[${metaData.internalPath()}]]${altText}`,
    children: []
  };
}

export default Markdown;
