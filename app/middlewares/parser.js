// @flow

import {
  type Store,
  type Dispatch,
} from 'redux';

import {
  getInstance as getRepositoryManagerInstance
} from '../common/repository_manager';

import {
  type $ReturnType,
  isSimilarError,
  MessageTypeFailed,
  MessageTypeError,
} from '../common/util';
import {
  type State,
  type Actions,
} from '../reducers/main';
import {
  PARSE_METADATA,
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
    }));
    return;
  }

  store.dispatch(async () => {
    const benchID = `parserMiddleware.parseMetaData benchmark ${metaData.repositoryName} ${metaData.path}`;
    const [parseResult, message] = await metaData.parse();
    console.time(benchID);
    if (isSimilarError(message)) {
      store.dispatch(addMessage(message));
    }
    if (parseResult == null) {
      store.dispatch(addMessage({
        type: MessageTypeError,
        message: `parserMiddleware.parseMetaData unexpected error. metaDataID=${action.payload.metaDataID} path=${metaData.path}`
      }));
      return;
    }

    store.dispatch(updateTabAction(action.payload.tabID, metaData.id, parseResult.content));
  });
}

export default parserMiddleware;
