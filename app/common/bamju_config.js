// @flow

export type bamjuConfigType = {
  projects: {
    [string]: string
  }
};

const bamjuConfig:bamjuConfigType = {
  projects: {
    'bamju-specifications': '/Users/tett23/projects/bamju-specifications'
  }
};

export function getBamjuConfig(): bamjuConfigType {
  return bamjuConfig;
}

export default {};
