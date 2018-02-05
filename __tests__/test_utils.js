// @flow
/* eslint no-undef: 0 */

import path from '../app/common/path';

import {
  type Buffer,
  type ItemType,
  ItemTypeUndefined,
  ItemTypeRepository,
  detectItemType
} from '../app/common/repository';

type DummyBuffer = {
  name?: string,
  path?: string,
  repositoryName?: string,
  absolutePath?: string,
  itemType?: ItemType,
  projectPath?: string,
  isLoaded?: boolean,
  isOpened?: boolean,
  items?: Array<Buffer>
};

function createDummyBuffer(obj: DummyBuffer = {}): Buffer {
  return Object.assign({}, {
    id: '',
    name: 'test',
    repositoryName: 'test',
    projectPath: '/tmp',
    path: '',
    absolutePath: '',
    itemType: ItemTypeUndefined,
    items: [],
    isLoaded: true,
    isOpened: false,
    parent: null,
    children: []
  }, obj);
}

type dummyType = {
  [_: string]: dummyType
}

function dummyBuffer(repositoryName: string, parentPath:string, items: dummyType): Array<Buffer> {
  return Object.keys(items).map((key) => {
    const name = path.basename(key);

    const itemPath = path.join(parentPath, key);

    return createDummyBuffer({
      name,
      repositoryName,
      path: itemPath,
      absolutePath: path.join('/tmp', repositoryName, itemPath),
      isLoaded: true,
      children: dummyBuffer(repositoryName, [parentPath, key].join('/'), items[key]),
      itemType: detectItemType(key)
    });
  });
}

export function createBufferTree(name: string, items: dummyType): Buffer {
  return createDummyBuffer({
    id: 'aaaaaa',
    name: '/',
    repositoryName: name,
    repositoryPath: `/tmp/bamju-test-${name}`,
    path: '/',
    absolutePath: `/tmp/bamju-test-${name}`,
    itemType: ItemTypeRepository,
    parent: null,
    children: dummyBuffer(name, '/', items),
    isLoaded: true,
    isOpened: true,
  });
}

describe('dummy', () => {
  it('createTree', () => {
    const item = createBufferTree('bamju-repository-test', {
      foo: {}
    });
    expect(item.children.length).toBe(1);
    expect(item.children[0].name).toBe('foo');
    expect(item.children[0].path).toBe('/foo');

    // item = dummyBuffer('/', { hoge: {}, fuga: {} });
    // expect(item.length).toBe(2);
    // expect(item[0].name).toBe('hoge');
    // expect(item[0].path).toBe('/hoge');
    // expect(item[1].name).toBe('fuga');
    // expect(item[1].path).toBe('/fuga');
    //
    // item = dummyBuffer('/', { a: { b: { c: {} } } });
    // expect(item.length).toBe(1);
    // expect(item[0].name).toBe('a');
    // expect(item[0].path).toBe('/a');
    // expect(item[0].items.length).toBe(1);
    // expect(item[0].items[0].name).toBe('b');
    // expect(item[0].items[0].path).toBe('/a/b');
    // expect(item[0].items[0].items.length).toBe(1);
    // expect(item[0].items[0].items[0].name).toBe('c');
    // expect(item[0].items[0].items[0].path).toBe('/a/b/c');
  });
});

export default {};
