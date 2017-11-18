// @flow

import util from 'util';
import fs from 'fs';

const marked = require('marked');

class Markdown {
  static async parse(path) {
    const readFile = util.promisify(fs.readFile);
    const buf:Buffer = await readFile(path);
    const md:string = buf.toString('UTF-8');
    const html:string = marked(md, {
      gfm: true,
      tables: true,
      breaks: true
    });

    return html;
  }
}

export default Markdown;
