// @flow

import { promisify } from 'util';
// $FlowFixMe
import CSVParser from 'csv-parse';

import {
  type Buffer,
} from '../../common/buffer';
import {
  RepositoryManager,
} from '../../common/repository_manager';
import {
  Markdown
} from './markdown';

export type TableOption = {
  delimiter: string
};

export class Table {
  static async parse(metaData: Buffer, text: string, options: TableOption, manager: RepositoryManager): Promise<{content: string}> {
    const csv = await (promisify(CSVParser))(text, { delimiter: options.delimiter });

    const tbody = csv.map((row) => {
      const cols = row.map((col) => {
        return `<td>${col}</td>`;
      });

      return `<tr>${cols.join('')}<tr>`;
    }).join('');

    const tableHTML = `<table>${tbody}</table>`;


    const ret = await Markdown.parse(metaData, tableHTML, manager);

    return ret;
  }
}

export default Table;
