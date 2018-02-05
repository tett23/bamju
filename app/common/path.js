// @flow

import path from 'path';

const sep = '/';

function join(...arr: Array<string>): string {
  // FIXME
  return path.join(...arr);
}

function basename(str: string): string {
  const items = split(str);

  if (items.length === 0) {
    return '';
  }

  return items[items.length - 1];
}

function split(str: string): Array<string> {
  return str.split(sep);
}

function extname(str: string): string {
  return path.extname(str);
}

function isAbsolute(str: string): boolean {
  return path.isAbsolute(str);
}

function normalize(str: string): string {
  return path.normalize(str);
}

function dirname(str: string): string {
  return path.dirname(str);
}

export default {
  sep,
  join,
  basename,
  split,
  extname,
  isAbsolute,
  normalize,
  dirname
};
