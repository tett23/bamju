// @flow

import * as React from 'react';
import Enzyme from 'enzyme';

import '../../global_config.test';

import {
  search
} from '../../../app/actions/searches';
import {
  Search,
} from '../../../app/renderer/components/Search';

describe('<Messages />', () => {
  let props;
  beforeEach(() => {
    props = search('foo', null).payload;
    props.results = [{
      buffer: {
        id: 'foo',
        name: 'foo',
        path: '/foo',
        repositoryName: 'bar',
        repositoryPath: '/tmp/test/bar',
        absolutePath: '/tmp/test/foo/bar',
        itemType: 'directory',
        parentID: null,
        childrenIDs: [],
        isLoaded: true,
        body: ''
      },
      position: {
        size: 0,
        offset: 0
      },
      detail: {
        text: 'foo',
        position: {
          size: 0,
          offset: 0
        }
      }
    }];
  });

  it('messagesが空のときはMessageは作られない', () => {
    const component = Enzyme.mount(<Search {...props} />);

    component.find('.input').simulate('keyUp', {
      key: 'Enter'
    });
  });
});
