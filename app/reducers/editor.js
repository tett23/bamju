// @flow

import {
  ItemTypeUndefined
} from '../common/metadata';
import {
  type Buffer
} from '../common/buffer';
import {
  type Actions
} from './editor_window';
import {
  OPEN_BUFFER,
  BURFFER_UPDATED,
} from '../actions/editor';

export type EditorState = {
  buffer: Buffer,
  content: string
};

export function initialEditorState(): EditorState {
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

export function editor(state: EditorState = initialEditorState(), action: Actions): EditorState {
  switch (action.type) {
  case OPEN_BUFFER: {
    return {
      buffer: action.buffer,
      content: action.content
    };
  }
  case BURFFER_UPDATED: {
    return {
      buffer: action.buffer,
      content: action.content
    };
  }
  default:
    return state;
  }
}
