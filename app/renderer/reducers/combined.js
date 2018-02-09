// @flow

import { combineReducers } from 'redux';
import {
  type Buffer
} from '../../common/buffer';
import {
  deepCopy,
  deepMerge
} from '../../common/util';

import {
  REFRESH_TREE_VIEW,
  REFRESH_TREE_VIEW_ITEM,
  refreshTreeView,
  openTreeViewItem
} from '../actions/tree_view';
import {
  OPEN_PAGE,
  BUFFER_UPDATED,
  openPageByBuffer,
  bufferUpdated
} from '../actions/tab';
import {
  CLOSE_DIALOG,
  OPEN_NEW_FILE_DIALOG,
  UPDATE_MESSAGE,
  UPDATE_FORM_VALUE,
  openNewFileDialog,
  closeDialog,
  updateMessage,
  updateFormValue
} from '../actions/modal';

import { type TreeViewState } from './tree_view';
import { type BrowserState } from './browser';
import { type ModalState } from './modal';

function initialTreeViewState(): TreeViewState {
  return {
    projects: []
  };
}

function updateBufferItem(source: Buffer[], projectName: string, path: string, update: Buffer): Array<Buffer> {
  const ret = source.map((item) => {
    if (item.projectName === projectName && item.path === path) {
      return update;
    }

    const r = Object.assign({}, item);
    r.items = updateBufferItem(item.items, projectName, path, update);

    return r;
  });

  return ret;
}

function findBufferItem(projects: Buffer[], projectName: string, path: string): ?Buffer {
  let ret:?Buffer = null;
  projects.some((item) => {
    if (item.projectName === projectName && item.path === path) {
      ret = item;
      return true;
    }

    ret = findBufferItem(item.items, projectName, path);
    if (ret != null) {
      return true;
    }

    return false;
  });

  return ret;
}

export function treeView(state: TreeViewState = initialTreeViewState(), action: ActionTypes): TreeViewState {
  console.log(`reducer mainView ${action.type}`, action, state);

  switch (action.type) {
  case REFRESH_TREE_VIEW: {
    return Object.assign({}, state, {
      projects: action.projects
    });
  }
  case REFRESH_TREE_VIEW_ITEM: {
    const newProjects = updateBufferItem(deepCopy(state.projects), action.projectName, action.path, action.item);

    return Object.assign({}, state, { projects: newProjects });
  }
  default:
    return state;
  }
}

export function initialBrowserState(): BrowserState {
  return {
    tabs: [
      {
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
      }
    ]
  };
}

export function browser(state: BrowserState = initialBrowserState(), action: ActionTypes): BrowserState {
  console.log(`reducer tabReducer ${action.type}`, action, state);

  switch (action.type) {
  case OPEN_PAGE: {
    return Object.assign({}, state, {
      tabs: [action.buffer]
    });
  }
  case BUFFER_UPDATED: {
    return Object.assign({}, state, {
      tabs: [action.buffer]
    });
  }
  default:
    return state;
  }
}

const initialModalState:ModalState = {
  newFileDialog: {
    isOpened: false,
    projectName: '',
    formValue: '',
    message: ''
  }
};

export function modal(state: ModalState = initialModalState, action: ActionTypes): ModalState {
  console.log(`reducer modal ${action.type}`, action, state);

  switch (action.type) {
  case OPEN_NEW_FILE_DIALOG: {
    const newState = deepCopy(state);
    newState.newFileDialog = {
      isOpened: true,
      projectName: action.projectName,
      formValue: action.formValue,
      message: '',
    };

    return newState;
  }
  case CLOSE_DIALOG: {
    const newState = deepCopy(state);
    newState.newFileDialog = initialModalState.newFileDialog;

    return newState;
  }
  case UPDATE_MESSAGE: {
    const newState = deepCopy(state);
    newState.newFileDialog.message = action.message;

    return newState;
  }
  case UPDATE_FORM_VALUE: {
    const newState = deepCopy(state);
    newState.newFileDialog.formValue = action.formValue;

    return newState;
  }
  default:
    return state;
  }
}

type __ReturnType<B, F: (...any) => B> = B; /* eslint no-unused-vars:0, flowtype/no-weak-types: 0 */
type $ReturnType<F> = __ReturnType<*, F>;

export type ActionTypes = $ReturnType<typeof openPageByBuffer>
| $ReturnType<typeof refreshTreeView>
| $ReturnType<typeof openTreeViewItem>
| $ReturnType<typeof openNewFileDialog>
| $ReturnType<typeof closeDialog>
| $ReturnType<typeof updateMessage>
| $ReturnType<typeof updateFormValue>;

export const appReducer = combineReducers({
  browser,
  treeView,
  modal,
});

export default appReducer;
