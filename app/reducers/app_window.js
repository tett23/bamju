// @flow

import {
  type $ReturnType,
} from '../common/util';

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

import {
  appReducer as globalReducer,
  type State as GlobalState,
  initialState as initialGlobalState,
} from './global';

export type Actions = $ReturnType<typeof openBuffer>
| $ReturnType<typeof bufferContentUpdated>
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
  browser: BrowserState,
  windows: WindowsState,
  modals: ModalsState,
  messages: MessagesState,
  global: GlobalState
};

export function initialState(): State {
  return {
    browser: initialBrowserState(),
    windows: initialWindowsState(),
    modals: initialModalsState(),
    messages: initialMessagesState(),
    global: initialGlobalState(),
  };
}

// なぜかcombineReducerが動かないので無理矢理
export function appReducer(s: State, a: Actions) {
  return {
    browser: browser(s.browser, a),
    windows: windows(s.windows, a),
    modals: modals(s.modals, a),
    messages: messages(s.messages, a),
    global: globalReducer(s.global, a)
  };
}

export default appReducer;
