// @flow

import { OPEN_PAGE } from '../actions/tab';
import { REFRESH_TREE_VIEW } from '../actions/tree_view';
import type { Projects, Buffer } from '../../common/project';

type actionType = {
  +type: string,
  buffer?: Buffer,
  projects?: Projects
};

const actionTypeDefault:actionType = {
  type: '',
};

type browser = {
  tabs: Array<Buffer>
};

type mainViewState = {
  mainView: {
    projects: Projects,
    browser: browser
  }
};

export const initialMainViewState = (): mainViewState => ({
  mainView: {
    projects: [],
    browser: {
      tabs: [
        {
          name: '',
          path: '',
          absolutePath: '',
          itemType: 'undefined',
          body: ''
        }
      ]
    }
  }
});

const mainView = (state: mainViewState = initialMainViewState(), action: actionType = actionTypeDefault): mainViewState => {
  console.log(`reducer mainView ${action.type}`, action, state);

  switch (action.type) {
  case OPEN_PAGE: {
    if (action.buffer === null || action.buffer === undefined) {
      return initialMainViewState();
    }

    const newMainView = Object.assign({}, state.mainView, {
      browser: {
        tabs: [action.buffer]
      }
    });

    return (Object.assign({}, state, {
      mainView: newMainView
    }): mainViewState);
  }
  case REFRESH_TREE_VIEW: {
    const newMainView = Object.assign({}, state.mainView, {
      projects: action.projects
    });

    return (Object.assign({}, state, {
      mainView: newMainView
    }): mainViewState);
  }
  default:
    return initialMainViewState();
  }
};

export default mainView;
