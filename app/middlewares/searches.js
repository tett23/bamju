// @flow

import {
  type Store,
  type Dispatch,
} from 'redux';

import { type Buffer } from '../common/buffer';
import {
  type MetaDataID,
  ItemTypeUndefined,
} from '../common/metadata';
import {
  Search,
} from '../common/search';
import * as Message from '../common/message';
import { type $ReturnType } from '../common/util';
import {
  type State,
} from '../reducers/main';
import {
  type Actions,
} from '../reducers/types';

import {
  type SearchState,
} from '../reducers/searches';
import {
  START,
  CANCEL,
  UPDATE_QUERY,
  UPDATE_OPTIONS,
  start as startAction,
} from '../actions/searches';
import {
  addMessage,
} from '../actions/messages';

export const searchesMiddleware = (store: Store<State, Actions>) => (next: Dispatch<Actions>) => (action: Actions) => {
  switch (action.type) {
  case START: {
    start(store, action);
    return next(action);
  }
  case CANCEL: {
    cancel(store, action);
    return next(action);
  }
  case UPDATE_QUERY: {
    next(action);
    cancel(store, action.payload.queryID);
    return;
  }
  case UPDATE_OPTIONS: {
    next(action);
    cancel(store, action.payload.queryID);
    return;
  }
  default:
    return next(action);
  }
};

const _manager:Search[] = [];

function start(store: Store<State, Actions>, action: $ReturnType<typeof startAction>) {
  const search = findOrCreate(action.payload, store.getState().global.buffers);

  search.start();
}

function cancel(store: Store<State, Actions>, queryID: string) {
  const idx = _manager.findIndex((item) => {
    return queryID === item.queryID;
  });
  if (idx === -1) {
    return;
  }

  _manager.splice(idx, 1);

  store.dispatch(addMessage(Message.info(`query canceled queryID=${queryID}`)));
}

function findOrCreate(search: SearchState, buffers: Buffer[]): Search {
  const ret = _manager.find((item) => {
    return item.queryID === search.queryID;
  });
  if (ret != null) {
    return ret;
  }

  return new Search(
    search.queryID,
    search.query,
    search.options,
    targetBuffers(search.options.repositoryName, search.options.targetID, buffers),
  );
}

function targetBuffers(repositoryName: ?string, targetID: ?MetaDataID, buffers: Buffer[]): Buffer[] {
  let ret;
  if (repositoryName == null && targetID == null) {
    ret = buffers;
  } else {
    ret = buffers;
    if (repositoryName) {
      ret = ret.filter((item) => {
        return item.repositoryName === repositoryName;
      });
    }
    if (targetID) {
      const buf = ret.find((item) => {
        return item.id === targetID;
      });
      if (buf == null) {
        return [];
      }

      ret = [buf].concat(children(buf, ret));
    }
  }

  return ret.filter((item) => {
    return item.itemType !== ItemTypeUndefined;
  });
}

function children(buffer: Buffer, buffers: Buffer[]): Buffer[] {
  return buffer.childrenIDs.reduce((r, childID) => {
    const buf = buffers.find((item) => {
      return item.id === childID;
    });
    if (buf == null) {
      return r;
    }

    return r.concat([buf].concat(children(buf, buffers)));
  }, []).filter(Boolean);
}

export default searchesMiddleware;
