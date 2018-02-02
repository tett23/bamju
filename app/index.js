// @flow
/* eslint global-require: 0 */

type WindowType = 'app' | 'editor';

window.loadWindow = (windowType: WindowType) => {
  switch (windowType) {
  case 'app':
    require('./app_index');
    break;
  case 'editor':
    require('./editor_index');
    break;
  default:
    break;
  }
};
