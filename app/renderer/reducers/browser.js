// @flow

import {
  ItemTypeUndefined
} from '../../common/metadata';
import {
  type Buffer
} from '../../common/buffer';
// import type { ActionTypes } from './combined';

export type BrowserState = {
  tabs: Array<{buffer: Buffer, content: string}>
};

export function initialBrowserState(): BrowserState {
  return {
    tabs: [
      {
        buffer: {
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
          body: ''
        },
        content: ''
      }
    ]
  };
}

export default {};
