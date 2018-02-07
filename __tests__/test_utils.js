// @flow
/* eslint no-undef: 0 */

import path from '../app/common/path';

import {
  type Buffer,
} from '../app/common/buffer';
import {
  type ItemType,
  createMetaDataID,
  ItemTypeUndefined,
  ItemTypeRepository,
  detectItemType
} from '../app/common/metadata';

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

function mergeDummyData(obj: DummyBuffer = {}): Buffer {
  return Object.assign({}, {
    id: createMetaDataID(),
    name: 'test',
    repositoryName: 'test',
    repositoryPath: '/tmp/bamju/test',
    path: '',
    absolutePath: '',
    itemType: ItemTypeUndefined,
    items: [],
    isLoaded: true,
    isOpened: false,
    parentID: null,
    childrenIDs: []
  }, obj);
}

function createDummyBuffer(item: DummyBuffer): Buffer {
  return mergeDummyData(item);
}

// function createDummyBuffers(items: Array<DummyBuffer>): Array<Buffer> {
//   return items.map((item) => {
//     return createDummyBuffer(item);
//   });
// }

type dummyType = {
  [string]: Array<string>
}

function createByPath(repositoryName: string, itemPath:string): Buffer {
  let name = path.basename(itemPath);
  if (itemPath === '/') {
    name = '/';
  }
  const repositoryPath = path.join('/tmp/bamju', repositoryName);
  const absolutePath = path.join(repositoryPath, itemPath);

  return createDummyBuffer({
    name,
    path: itemPath,
    repositoryName,
    repositoryPath,
    absolutePath,
    itemType: detectItemType(itemPath)
  });
}

export function dummy(items: dummyType): {[string]: Array<Buffer>} {
  const ret = {};
  const repositoryKeys = Object.keys(items);

  repositoryKeys.forEach((repositoryName) => {
    const repositoryBuffers:Array<Buffer> = [];

    items[repositoryName].forEach((itemPath) => {
      let parentPath = '/';
      path.split(path.join('/', path.dirname(itemPath))).forEach((name) => {
        parentPath = path.join(parentPath, name);
        const isExist = repositoryBuffers.some((item) => {
          return item.path === parentPath;
        });

        if (!isExist) {
          repositoryBuffers.push(createByPath(repositoryName, parentPath));
        }
      });

      repositoryBuffers.push(createByPath(repositoryName, path.join('/', itemPath)));
    });

    ret[repositoryName] = repositoryBuffers;
  });

  repositoryKeys.forEach((repositoryName) => {
    ret[repositoryName].forEach((buf, i) => {
      const parentPath = path.dirname(buf.path);
      if (buf.path === '/') {
        ret[repositoryName][i].childrenIDs = ret[repositoryName].filter((item) => {
          return !item.path.match(/^\/.+?\/.+/);
        }).filter((b) => {
          return b.id !== buf.id;
        }).map((item) => {
          return item.id;
        });

        return;
      } else if (parentPath === '/') {
        return;
      }

      const parentIdx = ret[repositoryName].findIndex((item) => {
        return item.path === parentPath;
      });
      if (parentIdx !== -1) {
        ret[repositoryName][i].parentID = ret[repositoryName][parentIdx].id;
        ret[repositoryName][parentIdx].childrenIDs.push(buf.id);
      }
    });
  });

  return ret;
}

it('dummy', () => {
  const items = dummy({
    test: [
      'foo/bar/baz.md'
    ]
  });

  expect(items.test.length).toBe(4);
});

export default {};
