// @flow

import { OPEN_PAGE } from '../actions/tab';
import { REFRESH_TREE_VIEW, REFRESH_TREE_VIEW_ITEM } from '../actions/tree_view';
import type { Projects, Buffer, ProjectItem } from '../../common/project';
import { Project } from '../../common/project';

export type ActionType = {
  +type: string,
  buffer?: Buffer,
  projects?: Projects,
  projectName?: string,
  path?: string,
  item?: ProjectItem
};

const actionTypeDefault:ActionType = {
  type: '',
};

type browser = {
  tabs: Array<Buffer>
};

export type mainViewState = {
  projects: Projects,
  browser: browser
};

export const initialMainViewState = (): mainViewState => {
  return {
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
  };
};

const mainView = (state: mainViewState = initialMainViewState(), action: ActionType = actionTypeDefault): mainViewState => {
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
  case REFRESH_TREE_VIEW_ITEM: {
    const idx = state.projects.findIndex((p) => {
      return p.name === action.projectName;
    });

    const project:?Project = state.projects[idx];
    if (project == null) {
      return initialMainViewState();
    }

    const newState:mainViewState = Object.assign({}, state);
    const { path, item: update } = action;
    if (path == null) {
      return initialMainViewState();
    }
    if (update == null) {
      return initialMainViewState();
    }

    newState.projects[idx].items.forEach((_, i: number) => {
      updateProjectItem(newState.projects[idx].items[i], path, update);
    });

    console.log('reducer REFRESH_TREE_VIEW_ITEM', newState);

    const o = state.projects;
    const n = newState.projects;
    const newProjects = Object.assign([], o, n);
    return (Object.assign({}, state, {
      projects: newProjects
    }): mainViewState);
  }
  default:
    return initialMainViewState();
  }
};

function updateProjectItem(item: ProjectItem, path: string, update: ProjectItem) {
  if (item.path === path) {
    item.items = update.items;
    return;
  }

  item.items.forEach((_, i: number) => {
    updateProjectItem(item.items[i], path, update);
  });
}

export default mainView;
