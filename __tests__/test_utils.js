// @flow
/* eslint no-undef: 0, no-empty: 0 */

import fs from 'fs';
import mock from 'mock-fs';
import 'raf/polyfill';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import path from '../app/common/path';

import './global_config.test';

import {
  type Buffer,
} from '../app/common/buffer';
import {
  type ItemType,
  createMetaDataID,
  ItemTypeUndefined,
  ItemTypeRepository,
  detectItemType,
  isSimilarDirectory,
  type MetaDataID,
} from '../app/common/metadata';

export type DummyBuffer = {
  id?: string,
  name?: string,
  path?: string,
  repositoryName?: string,
  repositoryPath?: string,
  absolutePath?: string,
  itemType?: ItemType,
  isLoaded?: boolean,
  childrenIDs?: MetaDataID[],
  parentID?: ?MetaDataID,
  body?: string
};

export function dummyBuffer(obj: DummyBuffer = {}): Buffer {
  return Object.assign({}, {
    id: createMetaDataID(),
    name: 'test',
    repositoryName: 'test',
    repositoryPath: '/tmp/bamju/test',
    path: '',
    absolutePath: '',
    itemType: ItemTypeUndefined,
    isLoaded: true,
    parentID: null,
    childrenIDs: [],
    body: ''
  }, obj);
}

export function createDummyBufferByPath(repositoryName: string, itemPath:string): Buffer {
  let name = path.basename(itemPath);
  if (itemPath === '/') {
    name = repositoryName;
  }
  const repositoryPath = path.join('/tmp/bamju', repositoryName);
  const absolutePath = path.join(repositoryPath, itemPath).replace(/\/$/, '');

  const ret = dummyBuffer({
    name,
    path: itemPath,
    repositoryName,
    repositoryPath,
    absolutePath,
    itemType: detectItemType(itemPath)
  });

  if (ret.path === '/') {
    ret.itemType = ItemTypeRepository;
  }

  return ret;
}

type dummyType = {
  [string]: Array<string>
}

export function dummy(items: dummyType): Buffer[] {
  mock({
    '/tmp/bamju': {}
  });
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
          repositoryBuffers.push(createDummyBufferByPath(repositoryName, parentPath));
        }
      });

      repositoryBuffers.push(createDummyBufferByPath(repositoryName, path.join('/', itemPath)));
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
        ret[repositoryName][i].parentID = ret[repositoryName].find((item) => {
          return item.itemType === ItemTypeRepository;
        }).id;
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

  repositoryKeys.forEach((repositoryName) => {
    const sorted = ret[repositoryName].sort((a, b) => {
      return a.absolutePath.length < b.absolutePath.length ? -1 : 1;
    });

    try {
      fs.mkdirSync(path.join('/tmp/bamju', repositoryName));
    } catch (_) {
    }

    sorted.forEach((buf) => {
      if (isSimilarDirectory(buf.itemType)) {
        try {
          fs.mkdirSync(buf.absolutePath);
        } catch (_) {
        }
      } else {
        try {
          fs.writeFileSync(buf.absolutePath, '');
        } catch (e) {
          console.log(`dummy error: ${e.message}`);
        }
      }
    });
  });

  return Object.keys(ret).reduce((r, key) => {
    return r.concat(ret[key]);
  }, []);
}

Enzyme.configure({ adapter: new Adapter() });

export function mountWithStore(component: React.Component, store: Store) {
  const context = {
    store,
  };

  return Enzyme.mount(component, { context });
}

// it('dummy', () => {
//   const items = dummy({
//     test: [
//       'foo/bar/baz.md'
//     ]
//   });
//
//   expect(items.test.length).toBe(4);
// });
