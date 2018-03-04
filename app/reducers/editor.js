// @flow

import {
  ItemTypeUndefined
} from '../common/metadata';
import {
  type Buffer
} from '../common/buffer';
import {
  type Actions
} from './types';
import {
  OPEN_BUFFER,
  BURFFER_UPDATED,
  BUFFER_SAVED,
} from '../actions/editor';

export type EditorState = {
  buffer: Buffer,
  content: string,
  isEdited: boolean
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
    content: '',
    isEdited: false,
  };
}

export function editor(state: EditorState = initialEditorState(), action: Actions): EditorState {
  switch (action.type) {
  case OPEN_BUFFER: {
    return {
      buffer: action.payload.buffer,
      content: action.payload.content,
      isEdited: false,
    };
  }
  case BURFFER_UPDATED: {
    return {
      buffer: action.payload.buffer,
      content: action.payload.content,
      isEdited: true,
    };
  }
  case BUFFER_SAVED: {
    return Object.assign({}, state, { isEdited: false });
  }
  default:
    return state;
  }
}
