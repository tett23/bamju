/* eslint no-await-in-loop:0, no-plusplus: 0, func-names: 0 */
// @flow

import marked from 'marked';
import { Manager, Project, ProjectItem } from '../../common/project';

const { markedParserTok, markedLexerToken } = require('./marked_overrides');

class Markdown {
  static async parse(repo: string, md: string, opt: {[string]: any} = {}): Promise<string> {
    const options = Object.assign({
      gfm: true,
      tables: true,
      breaks: true,
      renderer: undefined
    }, opt);
    const renderer = new marked.Renderer(options);
    options.renderer = opt.renderer || renderer;
    renderer.inlineLink = renderInlineLink;
    const lexer = new marked.Lexer(options);
    lexer.rules.inlineLink1 = /^\s*\[\[inline\|(.+?):(.+?)#(.+?)\]\]/;
    lexer.rules.inlineLink2 = /^\s*\[\[inline\|(.+?)#(.+?)\]\]/;
    lexer.rules.inlineLink3 = /^\s*\[\[inline\|(.+?):(.+?)\]\]/; lexer.rules.inlineLink4 = /^\s*\[\[inline\|(.+?)\]\]/;
    lexer.token = markedLexerToken;
    const parser = new marked.Parser(options);
    parser.tok = markedParserTok;
    // const tokens = lexer.lex(md);
    const tokens = await Promise.all(lexer.lex(md).map(async (tok) => {
      if (tok.type === 'inlineLink') {
        console.log('map inlineLink tok', tok);
        const r = tok.repo || repo;
        const html = await Markdown.parseInline(r, tok.name, tok.fragment);

        tok.html = html;
      }

      return tok;
    }));
    tokens.links = {};

    const parsed:string = parser.parse(tokens);

    const p5 = async (html: string): Promise<string> => {
      let ret:string = html;

      let re:RegExp = /\[\[(?!inline\|)([^{[\]]+?):([^{[\]]+?)\]\]\{(.+?)\}/;
      while (re.test(ret)) {
        ret = ret.replace(re, (_, r: string, name: string, text: string): string => {
          return Markdown.wikiLinkReplacer(r, name, text);
        });
      }

      re = /\[\[(?!inline\|)([^{[\]]+?)\]\]\{(.+?)\}/;
      while (re.test(ret)) {
        ret = ret.replace(re, (_, name: string, text: string): string => {
          return Markdown.wikiLinkReplacer(repo, name, text);
        });
      }

      re = /\[\[(?!inline\|)(.+?)\]\]/;
      while (re.test(ret)) {
        ret = ret.replace(re, (_, name: string): string => {
          return Markdown.wikiLinkReplacer(repo, name, name);
        });
      }

      return ret;
    };

    const ret:string = await Promise.resolve(parsed)
      .then(p5);

    return ret;
  }

  static async replaceInlineLink(repo: string, tokens: Array<any>): Promise<any> {
    return tokens.map((tok) => {
      if (tok.type === 'paragraph') {
        return {
          type: 'inlineLink',
          text: tok.text
        };
      }

      return tok;
    });
  }


  static wikiLinkReplacer(repo: string, name: string, text: string): string {
    const isExist:boolean = Markdown.isExistPage(repo, name);

    const availableClass:string = isExist ? 'available' : 'unavailable';
    const absolutePath:string = Markdown.absolutePath(repo, name);

    const onClickString:string = `${isExist ? 'wikiLinkOnClickAvailable' : 'wikiLinkOnClickUnAvailable'}('${repo}', '${name}')`;

    return `<span class="wikiLink ${availableClass}" data-absolute-path="${absolutePath}" onClick="${onClickString}">${text}</span>`;
  }

  static async parseInline(repo: string, name: string, fragment: ?string, headingLevel: number = 1): Promise<string> {
    // FIXME: 再帰すると壊れる
    const item:?ProjectItem = Manager.getProjectItem(repo, name);

    if (!item) {
      return `[[${repo}:${name}${fragment ? `#${fragment}` : ''}]]`;
    }

    let md:string = await item.content();
    console.log('parseInline md', md);
    console.log('parseInline match', md.match(/^#\s*(.+)$/m));
    md = md.replace(/^#\s*(.+)$/m, `# [[${repo}:${item.path}]]{$1}`);
    console.log('parseInline md', md);

    const ret:string = await Markdown.parse(repo, md);

    return ret;
  }

  static isExistPage(repo: string, name: string): boolean {
    const p:?Project = Manager.find(repo);
    if (p === null || p === undefined) {
      return false;
    }

    return p.isExistPage(name);
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

// async function renderInlineLink(repo: string, name: string, fragment: ?string): Promise<string> {
//   const ret:string = await Markdown.parseInline(repo, name, fragment);
//
//   return ret;
// }
function renderInlineLink(html: string): string {
  return `<div>${html}</div>`;
}

export default Markdown;
