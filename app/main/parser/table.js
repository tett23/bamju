// @flow

import { promisify } from 'util';
// $FlowFixMe
import CSVParser from 'csv-parse';

import {
  type StackItems,
} from './parser'; /* eslint flowtype-errors/show-errors: 0 */
import {
  MetaData,
  type ParseResult
} from '../../common/metadata';
import {
  Markdown
} from './markdown';

export type TableOption = {
  delimiter: string
};

const defaultOption = {
  delimiter: ','
};

export class Table {
  static async parse(metaData: MetaData, text: string, _: StackItems = [], options: TableOption = defaultOption): Promise<ParseResult> {
    const csv = await (promisify(CSVParser))(text, { delimiter: options.delimiter });

    const tbody = csv.map((row) => {
      const cols = row.map((col) => {
        return `<td>${col}</td>`;
      });

      return `<tr>${cols.join('')}<tr>`;
    }).join('');

    const tableHTML = `<table>${tbody}</table>`;


    const ret = await Markdown.parse(metaData, tableHTML);

    return ret;
  }
}

export default Table;
