/* eslint no-await-in-loop:0, no-plusplus: 0, func-names: 0, flowtype-errors/show-errors: 0 */
// @flow

import marked from 'marked';
import { Manager, ItemTypeUndefined } from '../../common/project';
import type { ProjectItem, ParseResult, ParseResults } from '../../common/project';
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

class Markdown implements Parser<MarkdownOption> {
  static async parse(projectItem: ProjectItem, md: string, stack: StackItems = [], opt: MarkdownOption = {}): Promise<ParseResult> {
    const options = Object.assign({}, defaultOption, opt);
    stack.push({ projectName: projectItem.projectName, absolutePath: projectItem.absolutePath });

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
        ret.repo = ret.repo || projectItem.projectName;
        const result:ParseResult = await Markdown.parseInline(ret, currentHeadingLevel, stack);
        children.push(result);

        ret.html = result.buffer.body;
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
          return Markdown.wikiLinkReplacer(r, name, text);
        });
      }

      re = /\[\[(?!inline\|)([^{[\]]+?):([^{[\]]+?)\]\]/;
      while (re.test(ret)) {
        ret = ret.replace(re, (_, r: string, name: string): string => {
          return Markdown.wikiLinkReplacer(r, name, name);
        });
      }

      re = /\[\[(?!inline\|)([^{[\]]+?):(.+?)\]\]/;
      while (re.test(ret)) {
        ret = ret.replace(re, (_, repo: string, name: string): string => {
          return Markdown.wikiLinkReplacer(repo, name, name);
        });
      }

      re = /\[\[(?!inline\|)([^{[\]]+?)\]\]\{(.+?)\}/;
      while (re.test(ret)) {
        ret = ret.replace(re, (_, name: string, text: string): string => {
          return Markdown.wikiLinkReplacer(projectItem.projectName, name, text);
        });
      }

      re = /\[\[(?!inline\|)([^{[\]]+?)\]\]/;
      while (re.test(ret)) {
        ret = ret.replace(re, (_, name: string): string => {
          return Markdown.wikiLinkReplacer(projectItem.projectName, name, name);
        });
      }

      return ret;
    };

    const html:string = await Promise.resolve(parsed)
      .then(p5);

    return {
      buffer: {
        name: projectItem.name,
        path: projectItem.path,
        projectName: projectItem.projectName,
        absolutePath: projectItem.absolutePath,
        itemType: projectItem.itemType,
        body: html
      },
      children
    };
  }

  static wikiLinkReplacer(repo: string, name: string, text: string): string {
    const isExist:boolean = Markdown.isExistPage(repo, name);

    const availableClass:string = isExist ? 'available' : 'unavailable';
    const absolutePath:string = Markdown.absolutePath(repo, name);

    const onClickString:string = `${isExist ? 'wikiLinkOnClickAvailable' : 'wikiLinkOnClickUnAvailable'}('${repo}', '${name}')`;

    return `<span class="wikiLink ${availableClass}" data-absolute-path="${absolutePath}" onClick="${onClickString}">${text}</span>`;
  }

  static async parseInline(token: ParseInlineToken, headingLevel: number = 1, stack: StackItems): Promise<ParseResult> {
    const {
      repo, name, fragment, text
    } = token;

    const projectItem:?ProjectItem = Manager.getProjectItem(repo, name);
    if (!projectItem) {
      let t:string = `\\[\\[inline|${repo}:${name}${fragment ? `#${fragment}` : ''}\\]\\]`;
      t = `[[${repo}:${name}]]{${t}}`;
      return {
        buffer: {
          name: '',
          path: '',
          projectName: '',
          absolutePath: '',
          itemType: ItemTypeUndefined,
          body: t
        },
        children: []
      };
    }

    let altText:string = !text ? `${projectItem.projectName}:${projectItem.path}` : text;
    altText = `{${altText}}`;


    // ループしていると壊れるので
    if (Markdown.checkInlineLoop(projectItem, stack)) {
      return {
        buffer: {
          name: projectItem.name,
          path: projectItem.path,
          projectName: projectItem.projectName,
          absolutePath: projectItem.absolutePath,
          itemType: projectItem.itemType,
          body: `!loop [[${repo}:${name}]]${altText}`
        },
        children: []
      };
    }

    let md:string = await projectItem.content();
    // h1のおきかえ
    md = md.replace(/^#\s*(.+)$/m, `# [[${repo}:${projectItem.path}]]{${text || name}}`);

    const ret:ParseResult = await Markdown.parse(projectItem, md, stack, { headingLevel });

    return ret;
  }

  static checkInlineLoop(projectItem: ProjectItem, stackItems: StackItems): boolean {
    let ret:boolean = false;

    stackItems.forEach((stackItem: StackItem) => {
      if (stackItem.projectName === projectItem.projectName && stackItem.absolutePath === projectItem.absolutePath) {
        ret = true;
      }
    });

    return ret;
  }

  static isExistPage(repo: string, name: string): boolean {
    const p:?ProjectItem = Manager.detect(repo, name);
    return p != null;
  }

  static absolutePath(repo: string, name: string): string {
    const p:?Project = Manager.find(repo);
    if (p === null || p === undefined) {
      return '';
    }

    const item:?ProjectItem = p.detect(name);
    if (item === null || item === undefined) {
      return '';
    }

    return item.absolutePath;
  }
}

function renderInlineLink(html: string): string {
  return `<div>${html}</div>`;
}

export default Markdown;
