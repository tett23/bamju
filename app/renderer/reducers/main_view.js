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

export type mainViewState = {
  projects: Projects,
  browser: browser
};

export const initialMainViewState = (): mainViewState => ({
  projects: [],
  browser: {
    tabs: [
      {
        name: '',
        projectName: '',
        path: '',
        absolutePath: '',
        itemType: 'undefined',
        body: ''
      }
    ]
  }
});

const mainView = (state: mainViewState = initialMainViewState(), action: actionType = actionTypeDefault): mainViewState => {
  console.log(`reducer mainView ${action.type}`, action, state);

  switch (action.type) {
  case OPEN_PAGE: {
    if (action.buffer === null || action.buffer === undefined) {
      return initialMainViewState();
    }

    return (Object.assign({}, state, {
      browser: {
        tabs: [action.buffer]
      }
    }): mainViewState);
  }
  case REFRESH_TREE_VIEW: {
    return (Object.assign({}, state, {
      projects: action.projects
    }): mainViewState);
  }
  default:
    return initialMainViewState();
  }
};

export default mainView;
