// @flow

import {
  combineReducers,
  type Store
} from 'redux';
import {
  ItemTypeUndefined
} from '../common/metadata';
import {
  type Buffer
} from '../common/buffer';
import {
  deepCopy,
  deepMerge
} from '../common/util';

import {
  addRepository,
  removeRepository,
} from '../actions/repositories';
import {
  reloadBuffers,
  updateBuffers,
} from '../actions/buffers';
import {
  initializeWindows,
  newWindow,
  closeWindow,
  addTab,
  closeTab,
  updateTab,
} from '../actions/windows';
import {
  openBuffer,
  bufferContentUpdated
} from '../actions/tab';
import {
  openInputDialog,
  closeDialog,
  closeAllDialog,
} from '../actions/modals';
import {
  addMessage,
  closeMessage,
  closeAllMessages
} from '../actions/messages';

import {
  repositories,
  type RepositoriesState,
  initialRepositoriesState,
} from './repositories';
import {
  buffers,
  type BuffersState,
  initialBuffersState,
} from './buffers';
import {
  windows,
  type WindowsState,
  initialWindowsState,
} from './windows';
import {
  browser,
  type BrowserState,
  initialBrowserState,
} from './browser';
import {
  modals,
  type ModalsState,
  initialModalsState,
} from './modals';
import {
  messages,
  type MessagesState,
  initialMessagesState,
} from './messages';

type __ReturnType<B, F: (...any) => B> = B; /* eslint no-unused-vars:0, flowtype/no-weak-types: 0 */
type $ReturnType<F> = __ReturnType<*, F>;

export type ActionTypes = $ReturnType<typeof addRepository>
| $ReturnType<typeof removeRepository>
| $ReturnType<typeof openBuffer>
| $ReturnType<typeof bufferContentUpdated>
| $ReturnType<typeof reloadBuffers>
| $ReturnType<typeof updateBuffers>
| $ReturnType<typeof initializeWindows>
| $ReturnType<typeof newWindow>
| $ReturnType<typeof closeWindow>
| $ReturnType<typeof addTab>
| $ReturnType<typeof closeTab>
| $ReturnType<typeof updateTab>
| $ReturnType<typeof openInputDialog>
| $ReturnType<typeof closeDialog>
| $ReturnType<typeof closeAllDialog>
| $ReturnType<typeof addMessage>
| $ReturnType<typeof closeMessage>
| $ReturnType<typeof closeAllMessages>;

export type State = {
  repositories: RepositoriesState,
  browser: BrowserState,
  buffers: BuffersState,
  windows: WindowsState,
  modals: ModalsState,
  messages: MessagesState
};

export function initialState(): State {
  return {
    repositories: initialRepositoriesState(),
    browser: initialBrowserState(),
    buffers: initialBuffersState(),
    windows: initialWindowsState(),
    modals: initialModalsState(),
    messages: initialMessagesState(),
  };
}

// なぜかcombineReducerが動かないので無理矢理
export function appReducer(s: State, a: ActionTypes) {
  return {
    repositories: repositories(s.repositories, a),
    browser: browser(s.browser, a),
    buffers: buffers(s.buffers, a),
    windows: windows(s.windows, a),
    modals: modals(s.modals, a),
    messages: messages(s.messages, a)
  };
}

export default appReducer;
