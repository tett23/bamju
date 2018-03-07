/* eslint no-undef: 0, no-empty: 0 */

import mock from 'mock-fs';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

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
