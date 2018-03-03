/* eslint no-undef: 0, no-empty: 0 */

import mock from 'mock-fs';

jest.setTimeout(500);
beforeEach(() => {
  mock({
    '/tmp/bamju': {}
  });
});

afterEach(() => {
  mock.restore();
});

it('dummy', () => {
  expect(true).toBe(true);
});
