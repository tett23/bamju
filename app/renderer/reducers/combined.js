// @flow

import { combineReducers } from 'redux';
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
  REFRESH_TREE_VIEW,
  UPDATE_BUFFER,
  refreshTreeView,
  updateBuffer,
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

export function initialTreeViewState(): TreeViewState {
  return {
    repositories: {}
  };
}

function updateBufferItem(source: {[string]: Buffer[]}, update: Buffer): {[string]: Buffer[]} {
  const repo = source[update.repositoryName];
  const newItems = repo.map((item) => {
    if (item.path === update.path) {
      return update;
    }

    return item;
  });

  const ret = deepCopy(source);
  ret[update.repositoryName] = deepCopy(newItems);

  return ret;
}

export function treeView(state: TreeViewState = initialTreeViewState(), action: ActionTypes): TreeViewState {
  console.log(`reducer mainView ${action.type}`, action, state);

  switch (action.type) {
  case REFRESH_TREE_VIEW: {
    return Object.assign({}, state, {
      repositories: action.repositories
    });
  }
  case UPDATE_BUFFER: {
    const newRepositories = updateBufferItem(deepCopy(state.repositories), action.buffer);

    return Object.assign({}, state, { repositories: newRepositories });
  }
  default:
    return state;
  }
}

export function initialBrowserState(): BrowserState {
  return {
    tabs: [
      {
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
      }
    ]
  };
}

export function browser(state: BrowserState = initialBrowserState(), action: ActionTypes): BrowserState {
  console.log(`reducer tabReducer ${action.type}`, action, state);

  switch (action.type) {
  case OPEN_PAGE: {
    return Object.assign({}, state, {
      tabs: [{ buffer: action.buffer, content: action.content }]
    });
  }
  case BUFFER_UPDATED: {
    return Object.assign({}, state, {
      tabs: [{ buffer: action.buffer, content: action.content }]
    });
  }
  default:
    return state;
  }
}

export function initialModalState(): ModalState {
  return {
    newFileDialog: {
      isOpened: false,
      repositoryName: '',
      formValue: '',
      message: ''
    }
  };
}

export function modal(state: ModalState = initialModalState(), action: ActionTypes): ModalState {
  console.log(`reducer modal ${action.type}`, action, state);

  switch (action.type) {
  case OPEN_NEW_FILE_DIALOG: {
    const newState = deepCopy(state);
    newState.newFileDialog = {
      isOpened: true,
      repositoryName: action.repositoryName,
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
| $ReturnType<typeof updateBuffer>
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
