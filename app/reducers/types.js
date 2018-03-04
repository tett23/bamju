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
  updateTab,
} from '../actions/browser';
import {
  initializeRepositoriesTreeView,
  openBuffer,
  closeBuffer,
} from '../actions/repositories_tree_view';
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
| $ReturnType<typeof updateTab>
| $ReturnType<typeof initializeRepositoriesTreeView>
| $ReturnType<typeof openBuffer>
| $ReturnType<typeof closeBuffer>
| $ReturnType<typeof openInputDialog>
| $ReturnType<typeof closeDialog>
| $ReturnType<typeof closeAllDialog>
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
