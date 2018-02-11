// @flow

import {
  type ActionTypes
} from './combined';
import {
  OPEN_PAGE,
  BUFFER_UPDATED,
} from '../actions/tab';

import {
  ItemTypeUndefined
} from '../../common/metadata';
import {
  type Buffer
} from '../../common/buffer';
import {
  deepCopy,
} from '../../common/util';

export type BrowserState = {
  tabs: Array<{buffer: Buffer, content: string}>
};

export function tabDefault() {
  return {
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
  };
}

export function initialBrowserState(): BrowserState {
  return {
    tabs: [tabDefault()]
  };
}

export function browser(state: BrowserState = initialBrowserState(), action: ActionTypes): BrowserState {
  // console.log(`reducer tabReducer ${action.type}`, action, state);

  switch (action.type) {
  case OPEN_PAGE: {
    return Object.assign({}, state, {
      tabs: [{ buffer: action.buffer, content: action.content }]
    });
  }
  case BUFFER_UPDATED: {
    const idx = state.tabs.findIndex((buf) => {
      return buf.buffer.id === action.buffer.id;
    });
    if (idx === -1) {
      return state;
    }

    const newState = deepCopy(state);
    newState.tabs[idx].content = action.content;

    return newState;
  }
  default:
    return state;
  }
}
