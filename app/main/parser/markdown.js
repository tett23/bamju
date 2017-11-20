// @flow

import util from 'util';
import fs from 'fs';
import marked from 'marked';
import { Manager, Project, ProjectItem } from '../../common/project';

class Markdown {
  static async parseByAbsolutePath(repo: string, path: string): Promise<string> {
    const buf:Buffer = await util.promisify(fs.readFile)(path);
    const md:string = buf.toString('UTF-8');

    return Markdown.parse(repo, md);
  }
  static async parse(repo: string, md: string): Promise<string> {
    let html:string = marked.parse(md, {
      gfm: true,
      tables: true,
      breaks: true
    });

    html = html.replace(/\[\[(.+:)(.+?)\]\]\{(.+?)\}/, (_, r: string, name: string, text: string): string => Markdown.wikiLinkReplacer(r, name, text));
    html = html.replace(/\[\[(.+?)\]\]\{(.+?)\}/, (_, name: string, text: string): string => Markdown.wikiLinkReplacer(repo, name, text));
    html = html.replace(/\[\[(.+?)\]\]/, (_, name: string): string => Markdown.wikiLinkReplacer(repo, name, name));

    return html;
  }

  static wikiLinkReplacer(repo: string, name: string, text: string): string {
    const isExist:boolean = Markdown.isExistPage(repo, name);

    const availableClass:string = isExist ? 'available' : 'unavailable';
    const absolutePath:string = Markdown.absolutePath(repo, name);

    const onClickString:string = `${isExist ? 'wikiLinkOnClickAvailable' : 'wikiLinkOnClickUnAvailable'}('${repo}', '${name}')`;

    return `<span class="wikiLink ${availableClass}" data-absolute-path="${absolutePath}" onClick="${onClickString}">${text}</span>`;
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
