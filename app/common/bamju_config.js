// @flow

export type BamjuConfig = {
  projects: {
    [string]: string
  },
  windows: [{
    x: number,
    y: number,
    width: number,
    height: number
  }]
};

const defaultConfig:BamjuConfig = {
  projects: {
    'bamju-specifications': '/Users/tett23/projects/bamju-specifications',
    喃語の読みかた: '/Users/tett23/Dropbox/projects/喃語の読みかた',
    angelic: '/Users/tett23/Dropbox/projects/angelic'
  },
  windows: [
    {
      x: 100,
      y: 100,
      width: 1024,
      height: 728
    }
  ]
};

const Config:BamjuConfig = Object.assign({}, defaultConfig);

export default Config;
