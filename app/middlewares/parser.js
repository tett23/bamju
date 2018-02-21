// @flow

import {
  type Store,
  type Dispatch,
} from 'redux';

import {
  getInstance as getRepositoryManagerInstance
} from '../common/repository_manager';

import {
  type WindowID,
} from '../common/window';
import {
  type $ReturnType,
  isSimilarError,
  MessageTypeFailed,
  MessageTypeError,
} from '../common/util';
import {
  type MetaData,
  resolveInternalPath,
} from '../common/metadata';
import {
  type State,
} from '../reducers/main';
import {
  type Actions,
} from '../reducers/types';
import {
  PARSE_METADATA,
  PARSE_INTERNAL_PATH,
  parseInternalPath as parseInternalPathAction,
  parseMetaData as parseMetaDataAction,
} from '../actions/parser';
import {
  updateTab as updateTabAction,
} from '../actions/browser';
import {
  addMessage,
} from '../actions/messages';

export const parserMiddleware = (store: Store<State, Actions>) => (next: Dispatch<Actions>) => (action: Actions) => {
  switch (action.type) {
  case PARSE_METADATA: {
    parseMetaData(store, action);
    return next(action);
  }
  case PARSE_INTERNAL_PATH: {
    parseInternalPath(store, action);
    return next(action);
  }
  default:
    return next(action);
  }
};

function parseMetaData(store: Store<State, Actions>, action: $ReturnType<typeof parseMetaDataAction>) {
  const manager = getRepositoryManagerInstance();

  const metaData = manager.getItemByID(action.payload.metaDataID);
  if (metaData == null) {
    store.dispatch(addMessage({
      type: MessageTypeFailed,
      message: `parserMiddleware.parseMetaData MetaData not found. metaDataID=${action.payload.metaDataID}`
    }, { targetWindowID: action.meta.fromWindowID }));
    return;
  }

  parse(store, action.payload.tabID, metaData, action.meta.fromWindowID);
}

function parseInternalPath(store: Store<State, Actions>, action: $ReturnType<typeof parseInternalPathAction>) {
  const manager = getRepositoryManagerInstance();

  const { repositoryName, path } = resolveInternalPath(action.payload.internalPath);

  if (repositoryName == null) {
    store.dispatch(addMessage({
      type: MessageTypeFailed,
      message: `parserMiddleware.parseInternalPath internalPath parse error. internalPath=${action.payload.internalPath}`
    }, { targetWindowID: action.meta.fromWindowID }));
    return;
  }

  const metaData = manager.detect(repositoryName, path);
  if (metaData == null) {
    store.dispatch(addMessage({
      type: MessageTypeFailed,
      message: `parserMiddleware.parseInternalPath MetaData not found. internalPath=${action.payload.internalPath}`
    }, { targetWindowID: action.meta.fromWindowID }));
    return;
  }

  parse(store, action.payload.tabID, metaData, action.meta.fromWindowID);
}

function parse(store: Store<State, Actions>, tabID: string, metaData: MetaData, windowID: ?WindowID) {
  store.dispatch(async () => {
    const benchID = `parserMiddleware.parseMetaData benchmark ${metaData.repositoryName} ${metaData.path}`;
    const [parseResult, message] = await metaData.parse();
    console.time(benchID);
    if (isSimilarError(message)) {
      store.dispatch(addMessage(message, { targetWindowID: windowID }));
    }
    if (parseResult == null) {
      store.dispatch(addMessage({
        type: MessageTypeError,
        message: `parserMiddleware.parse unexpected error. metaDataID=${metaData.id} path=${metaData.path}`
      }, { targetWindowID: windowID }));
      return;
    }

    store.dispatch(updateTabAction(tabID, metaData.id, parseResult.content, { targetWindowID: windowID }));
  });
}

export default parserMiddleware;
