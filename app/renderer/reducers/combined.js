// @flow

import {
  combineReducers,
  type Store
} from 'redux';
import {
  ItemTypeUndefined
} from '../../common/metadata';
import {
  type Buffer
} from '../../common/buffer';
import {
  deepCopy,
  deepMerge
} from '../../common/util';

import {
  refreshTreeView,
  updateBuffer,
} from '../actions/repositories';
import {
  openPageByBuffer,
  bufferUpdated
} from '../actions/tab';
import {
  openNewFileDialog,
  closeDialog,
  updateMessage,
  updateFormValue
} from '../actions/modal';

import {
  treeView,
  type TreeViewState,
  initialTreeViewState,
} from './repositories';
import {
  browser,
  type BrowserState,
  initialBrowserState,
} from './browser';
import {
  modal,
  type ModalState,
  initialModalState,
} from './modal';

type __ReturnType<B, F: (...any) => B> = B; /* eslint no-unused-vars:0, flowtype/no-weak-types: 0 */
type $ReturnType<F> = __ReturnType<*, F>;

export type ActionTypes = $ReturnType<typeof openPageByBuffer>
| $ReturnType<typeof refreshTreeView>
| $ReturnType<typeof updateBuffer>
| $ReturnType<typeof openNewFileDialog>
| $ReturnType<typeof closeDialog>
| $ReturnType<typeof updateMessage>
| $ReturnType<typeof updateFormValue>;

type State = {
  browser: BrowserState,
  treeView: TreeViewState,
  modal: ModalState
};

export function initialState(): State {
  return {
    browser: initialBrowserState(),
    treeView: initialTreeViewState(),
    modal: initialModalState()
  };
}

// なぜかcombineReducerが動かないので無理矢理
export function appReducer(s: State, a: ActionTypes) {
  return {
    browser: browser(s.browser, a),
    treeView: treeView(s.treeView, a),
    modal: modal(s.modal, a),
  };
}

export default appReducer;
