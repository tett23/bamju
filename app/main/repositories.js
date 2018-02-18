// @flow

import {
} from '../menu';
import {
  subscribe,
  getState,
  dispatch,
} from './event_dispatcher';
import {
  reloadBuffers,
} from '../actions/buffers';
import {
  addMessage,
} from '../actions/messages';
import {
  type RepositoriesState,
} from '../reducers/repositories';
import {
  getInstance as getRepositoryManagerInstance,
} from '../common/repository_manager';
import {
  MessageTypeError
} from '../common/util';

let prevState:RepositoriesState = [];
subscribe(() => {
  const currentState = getState().repositories;
  if (prevState === currentState) {
    return;
  }

  const removes = prevState.filter((b) => {
    return !currentState.some((a) => {
      return a.absolutePath === b.absolutePath && a.repositoryName === b.repositoryName;
    });
  });
  removes.forEach((item) => {
    getRepositoryManagerInstance().removeRepository(item.repositoryName);
  });

  const additions = currentState.filter((a) => {
    return !prevState.some((b) => {
      return a.absolutePath === b.absolutePath && a.repositoryName === b.repositoryName;
    });
  });
  additions.forEach((item) => {
    getRepositoryManagerInstance().addRepository(item, []);
  });

  try {
    getRepositoryManagerInstance().loadRepositories().then((r) => {
      dispatch(reloadBuffers(getRepositoryManagerInstance().toBuffers()));
      return r;
    }).catch((r) => {
      dispatch(addMessage({
        type: MessageTypeError,
        message: `repositories.subscribe error: ${r}`
      }));
      return r;
    });
  } catch (e) {
    dispatch(addMessage({
      type: MessageTypeError,
      message: `repositories.subscribe error: ${e.message}`
    }));
  }

  prevState = getState().repositories;
});
