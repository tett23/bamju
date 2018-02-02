// @flow

import { promisify } from 'util';
import CSVParser from 'csv-parse';

import {
  type Parser,
  type StackItems,
} from './parser'; /* eslint flowtype-errors/show-errors: 0 */
import {
  ProjectItem,
  type ParseResult
} from '../../common/project';

export type TableOption = {
  delimiter: string
};

const defaultOption = {
  delimiter: ','
};

export class Table implements Parser<TableOption> {
  static async parse(projectItem: ProjectItem, text: string, _: StackItems = [], options: TableOption = defaultOption): Promise<ParseResult> {
    const csv = await (promisify(CSVParser))(text, { delimiter: options.delimiter });

    const tbody = csv.map((row) => {
      const cols = row.map((col) => {
        return `<td>${col}</td>`;
      });

      return `<tr>${cols.join('')}<tr>`;
    }).join('');

    const html = `<table>${tbody}</table>`;

    return {
      buffer: {
        name: projectItem.name,
        path: projectItem.path,
        projectName: projectItem.projectName,
        absolutePath: projectItem.absolutePath,
        itemType: projectItem.itemType,
        body: html
      },
      children: []
    };
  }
}

export default Table;
