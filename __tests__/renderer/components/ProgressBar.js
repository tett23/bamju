// @flow

import * as React from 'react';
import Enzyme from 'enzyme';

import '../../global_config.test';

import ProgressBar from '../../../app/renderer/components/ProgressBar';

describe('<ProgressBar />', () => {
  it('ゼロ除算しない', () => {
    const component = Enzyme.mount(<ProgressBar current={1} total={2} />);
    expect(component.find('.progress').props().style.width).toBe('50%');
  });

  it('ゼロ除算しない', () => {
    const component = Enzyme.mount(<ProgressBar current={0} total={0} />);
    expect(component.find('.progress').props().style.width).toBe('0%');
  });

  it('100%を越えない', () => {
    const component = Enzyme.mount(<ProgressBar current={2} total={1} />);
    expect(component.find('.progress').props().style.width).toBe('100%');
  });
});
