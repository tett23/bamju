// @flow

import {
  MetaData,
  type ParseResult,
} from '../../common/metadata';

export type StackItem = {
  repositoryName: string,
  absolutePath: string
};
export type StackItems = Array<StackItem>;

// 本来interfaceだけど、staticのチェックをするにはこうするしかないらしい
export type Parser<OptionType> = {
  parse(MetaData, string, StackItems, OptionType): Promise<ParseResult>
};
