// @flow

import util from 'util';
import fs from 'fs';
import marked from 'marked';

class Markdown {
  static async parse(path: string): Promise<string> {
    const buf:Buffer = await util.promisify(fs.readFile)(path);
    const md:string = buf.toString('UTF-8');
    const html:string = marked.parse(md, {
      gfm: true,
      tables: true,
      breaks: true
    });

    return html;
  }
}

export default Markdown;
