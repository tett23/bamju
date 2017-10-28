// @flow

export type bamjuConfigType = {
  projects: {
    [string]: string
  }
};

const bamjuConfig:bamjuConfigType = {
  projects: {
    'bamju-specifications': '/Users/tett23/projects/bamju-specifications',
    喃語の読みかた: '/Users/tett23/Dropbox/projects/喃語の読みかた',
    angelic: '/Users/tett23/Dropbox/projects/angelic'
  }
};

export function getBamjuConfig(): bamjuConfigType {
  return bamjuConfig;
}

export default {};
