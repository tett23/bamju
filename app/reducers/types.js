// @flow

import {
  type $ReturnType,
} from '../common/util';

import {
  type WindowID,
} from '../common/window';

import {
  addTab,
  closeTab,
  closeAllTabs,
  updateTab,
  updateCurrentTab,
  activeTab,
} from '../actions/browser';
import {
  initializeRepositoriesTreeView,
  openBuffer,
  closeBuffer,
} from '../actions/repositories_tree_view';
import {
  search,
  start,
  cancel,
  destroy,
  clear,
  updateResult,
  updateProgress,
  updateOptions,
  updateQuery,
  updateSelectedIndex,
  complete,
} from '../actions/searches';
import {
  openInputDialog,
  closeDialog,
  closeAllDialog,
  closeSearchDialog,
} from '../actions/modals';
import {
  addMessage,
  closeMessage,
  closeAllMessages
} from '../actions/messages';
import {
  openBuffer as openBufferEditor,
  bufferUpdated,
  bufferSaved,
} from '../actions/editor';
import {
  initializeRepositories,
  addRepository,
  removeRepository,
} from '../actions/repositories';
import {
  reloadBuffers,
  updateBuffers,
  bufferContentUpdated,
} from '../actions/buffers';
import {
  initializeWindows,
  newWindow,
  closeWindow,
} from '../actions/windows';

export type Meta = {
  fromWindowID?: ?WindowID,
  targetWindowID?: ?WindowID,
  scope?: string
};

export type Actions = (
  $ReturnType<typeof addTab>
| $ReturnType<typeof closeTab>
| $ReturnType<typeof closeAllTabs>
| $ReturnType<typeof updateTab>
| $ReturnType<typeof updateCurrentTab>
| $ReturnType<typeof activeTab>
| $ReturnType<typeof initializeRepositoriesTreeView>
| $ReturnType<typeof openBuffer>
| $ReturnType<typeof closeBuffer>
| $ReturnType<typeof search>
| $ReturnType<typeof start>
| $ReturnType<typeof cancel>
| $ReturnType<typeof destroy>
| $ReturnType<typeof clear>
| $ReturnType<typeof updateProgress>
| $ReturnType<typeof updateResult>
| $ReturnType<typeof updateQuery>
| $ReturnType<typeof updateOptions>
| $ReturnType<typeof updateSelectedIndex>
| $ReturnType<typeof complete>
| $ReturnType<typeof openInputDialog>
| $ReturnType<typeof closeDialog>
| $ReturnType<typeof closeAllDialog>
| $ReturnType<typeof closeSearchDialog>
| $ReturnType<typeof addMessage>
| $ReturnType<typeof closeMessage>
| $ReturnType<typeof closeAllMessages>
| $ReturnType<typeof openBufferEditor>
| $ReturnType<typeof bufferUpdated>
| $ReturnType<typeof bufferSaved>
| $ReturnType<typeof initializeRepositories>
| $ReturnType<typeof addRepository>
| $ReturnType<typeof removeRepository>
| $ReturnType<typeof reloadBuffers>
| $ReturnType<typeof updateBuffers>
| $ReturnType<typeof bufferContentUpdated>
| $ReturnType<typeof initializeWindows>
| $ReturnType<typeof newWindow>
| $ReturnType<typeof closeWindow>
);
