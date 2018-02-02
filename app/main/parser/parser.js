// @flow

import {
  ProjectItem,
  type ParseResult,
} from '../../common/project';

export type StackItem = {
  projectName: string,
  absolutePath: string
};
export type StackItems = Array<StackItem>;

// 本来interfaceだけど、staticのチェックをするにはこうするしかないらしい
export type Parser<OptionType> = {
  parse(ProjectItem, string, StackItems, OptionType): Promise<ParseResult>
};
