/* eslint no-await-in-loop:0 */
// @flow

import marked from 'marked';
import { Manager, Project, ProjectItem } from '../../common/project';

class Markdown {
  static async parse(repo: string, md: string): Promise<string> {
    const parsed:string = marked.parse(md, {
      gfm: true,
      tables: true,
      breaks: true
    });

    const p1 = async (html: string): Promise<string> => {
      let ret:string = html;
      const re:RegExp = /\[\[inline\|(.+?):(.+?)#(.+?)\]\]?/;

      while (re.test(ret)) {
        const m:?Array<string> = html.match(re);
        if (m === undefined || m === null) {
          return html;
        }
        const [g, r, name, fragment] = m;
        const replacement = await Markdown.parseInline(r, name, fragment);

        ret = html.replace(g, replacement);
      }

      return ret;
    };

    const p2 = async (html: string): Promise<string> => {
      let ret:string = html;
      const re:RegExp = /\[\[inline\|(.+?)#(.+?)\]\]?/;

      while (re.test(ret)) {
        const m:?Array<string> = html.match(re);
        if (m === undefined || m === null) {
          return ret;
        }
        const [g, name, fragment] = m;
        const replacement = await Markdown.parseInline(repo, name, fragment);

        ret = html.replace(g, replacement);
      }

      return ret;
    };

    const p3 = async (html: string): Promise<string> => {
      let ret:string = html;
      const re:RegExp = /\[\[inline\|(.+?):(.+?)\]\]?/;

      while (re.test(ret)) {
        const m:?Array<string> = html.match(re);
        if (m === undefined || m === null) {
          return ret;
        }
        const [g, r, name] = m;
        const replacement = await Markdown.parseInline(r, name, null);

        ret = html.replace(g, replacement);
      }

      return ret;
    };

    const p4 = async (html: string): Promise<string> => {
      let ret:string = html;
      const re:RegExp = /\[\[inline\|(.+?)\]\]?/;

      while (re.test(ret)) {
        const m:?Array<string> = ret.match(re);
        if (m === undefined || m === null) {
          return ret;
        }

        const [g, name] = m;
        const replacement = await Markdown.parseInline(repo, name, null);

        ret = ret.replace(g, replacement);
      }

      return ret;
    };

    const p5 = async (html: string): Promise<string> => {
      let ret:string = html.replace(/\[\[(.+?):(.+?)\]\]\{(.+?)\}/, (_, r: string, name: string, text: string): string => Markdown.wikiLinkReplacer(r, name, text));
      ret = ret.replace(/\[\[(.+?)\]\]\{(.+?)\}/, (_, name: string, text: string): string => Markdown.wikiLinkReplacer(repo, name, text));
      ret = ret.replace(/\[\[(.+?)\]\]/, (_, name: string): string => Markdown.wikiLinkReplacer(repo, name, name));

      return ret;
    };

    const ret:string = await Promise.resolve(parsed)
      .then(p1)
      .then(p2)
      .then(p3)
      .then(p4)
      .then(p5);

    return ret;
  }

  static wikiLinkReplacer(repo: string, name: string, text: string): string {
    const isExist:boolean = Markdown.isExistPage(repo, name);

    const availableClass:string = isExist ? 'available' : 'unavailable';
    const absolutePath:string = Markdown.absolutePath(repo, name);

    const onClickString:string = `${isExist ? 'wikiLinkOnClickAvailable' : 'wikiLinkOnClickUnAvailable'}('${repo}', '${name}')`;

    return `<span class="wikiLink ${availableClass}" data-absolute-path="${absolutePath}" onClick="${onClickString}">${text}</span>`;
  }

  static async parseInline(repo: string, name: string, fragment: ?string): Promise<string> {
    // 再帰すると壊れる
    const item:?ProjectItem = Manager.getProjectItem(repo, name);

    if (item === undefined || item === null) {
      return `[[${repo}:${name}${fragment ? `#${fragment}` : ''}]]`;
    }

    const ret:string = await Markdown.parse(repo, await item.content());

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

export default Markdown;
