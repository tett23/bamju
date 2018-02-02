// @flow

import { OPEN_PAGE } from '../actions/tab';
import type { Buffer } from '../../common/project';
import type { ActionTypes } from './index';

export type BrowserAction = {
  type: 'OPEN_PAGE',
  buffer: Buffer
};

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

function defaultAction(): {type: string} {
  return { type: '' };
}

export function browser(state: BrowserState = initialBrowserState(), action: ActionTypes = defaultAction()): BrowserState {
  console.log(`reducer tabReducer ${action.type}`, action, state);

  switch (action.type) {
  case OPEN_PAGE: {
    return (Object.assign({}, state, {
      tabs: [action.buffer]
    }): BrowserState);
  }
  default:
    return state;
  }
}

export default browser;
