/* eslint no-undef: 0, no-empty: 0 */

import fs from 'fs';

jest.setTimeout(500);
beforeEach(() => {
  try {
    fs.mkdirSync('/tmp/bamju');
  } catch (_) {
  }
});

afterEach(() => {
  try {
    rmForce('/tmp/bamju');
  } catch (e) {
    console.log(e);
  }
});

it('dummy', () => {
  expect(true).toBe(true);
});

function rmForce(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) {
        rmForce(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}
