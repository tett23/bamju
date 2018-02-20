// @flow

import {
  type Actions
} from './app_window';
import {
  OPEN_BUFFER,
  BUFFER_CONTENT_UPDATED,
} from '../actions/tab';

import {
  ItemTypeUndefined
} from '../common/metadata';
import {
  type Buffer
} from '../common/buffer';
import {
  deepCopy,
} from '../common/util';

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

export function browser(state: BrowserState = initialBrowserState(), action: Actions): BrowserState {
  // console.log(`reducer tabReducer ${action.type}`, action, state);

  switch (action.type) {
  case OPEN_BUFFER: {
    return Object.assign({}, state, {
      tabs: [{ buffer: action.buffer, content: action.content }]
    });
  }
  case BUFFER_CONTENT_UPDATED: {
    const { metaDataID, content } = action;
    const idx = state.tabs.findIndex((buf) => {
      return buf.buffer.id === metaDataID;
    });
    if (idx === -1) {
      return state;
    }

    const newState = deepCopy(state);
    newState.tabs[idx].content = content;

    return newState;
  }
  default:
    return state;
  }
}
