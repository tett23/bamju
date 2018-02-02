// @flow

import type { Buffer } from '../../common/project';
// import type { ActionTypes } from './combined';

export type BrowserState = {
  tabs: Array<Buffer>
};

export function initialBrowserState(): BrowserState {
  return {
    tabs: [
      {
        name: '',
        projectName: '',
        path: '',
        absolutePath: '',
        itemType: 'undefined',
        body: ''
      }
    ]
  };
}

export default {};
