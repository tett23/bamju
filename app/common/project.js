// @flow

export type project = {
  name: string,
  path: string,
  items: projectItems
};
export type projects = Array<project>;

export type projectItem = {
  name: string,
  path: string,
  items: projectItems
};
export type projectItems = Array<projectItem>;
