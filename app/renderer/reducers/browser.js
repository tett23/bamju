// @flow

import {
  ItemTypeUndefined
} from '../../common/metadata';
import {
  type Buffer
} from '../../common/buffer';
// import type { ActionTypes } from './combined';

export type BrowserState = {
  tabs: Array<Buffer>
};

export function initialBrowserState(): BrowserState {
  return {
    tabs: [
      {
        id: '',
        name: '',
        path: '',
        repositoryName: '',
        repositoryPath: '',
        absolutePath: '',
        itemType: ItemTypeUndefined,
        parentID: null,
        childrenIDs: [],
        isOpened: false,
        isLoaded: false,
      }
    ]
  };
}

export default {};
