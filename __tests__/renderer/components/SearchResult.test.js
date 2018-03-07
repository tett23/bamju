// @flow

import * as React from 'react';
import Enzyme from 'enzyme';

import '../../global_config.test';

import {
  type SearchResult as Result,
} from '../../../app/common/search';

import SearchResult from '../../../app/renderer/components/SearchResult';

describe('<SearchResult />', () => {
  let results: Result[];
  let props;
  beforeEach(() => {
    results = [{
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
    props = {
      results,
      selectedIndex: 0,
      onSelected: (_) => {}
    };
  });

  it('resultsに応じて.itemが作られる', () => {
    const component = Enzyme.mount(<SearchResult {...props} />);

    expect(component.find('.item').length).toBe(1);
    const text = component.find('.item .filename span').reduce((r, s) => {
      return r + s.text();
    }, '');
    expect(text).toBe(results[0].buffer.name);
  });

  it('resultsが空のときは.itemも空', () => {
    props.results = [];
    const component = Enzyme.mount(<SearchResult {...props} />);

    expect(component.find('.item').length).toBe(0);
  });

  it('onSelectedIndex番目の.itemには.selectedが付いている', () => {
    const buf = Object.assign({}, results[0].buffer, {
      id: 'bar'
    });
    props.results.push(Object.assign({}, results[0], {
      buffer: buf
    }));
    props.selectedIndex = 1;
    const component = Enzyme.mount(<SearchResult {...props} />);

    const items = component.find('.searchResult');
    expect(items.children().length).toBe(2);
    expect(items.childAt(0).props().className).not.toMatch('selected');
    expect(items.childAt(1).props().className).toMatch('selected');
  });

  it('detailがnullでないときは.detailが作成される', () => {
    props.results[0].detail = {
      text: 'foo',
      position: {
        size: 0,
        offset: 0
      }
    };
    const component = Enzyme.mount(<SearchResult {...props} />);

    const detail = component.find('.searchResult .detail');
    expect(detail.length).toBe(1);
  });

  it('detailがnullのときは.detailが作成されない', () => {
    // $FlowFixMe
    props.results[0].detail = null;
    const component = Enzyme.mount(<SearchResult {...props} />);

    const detail = component.find('.searchResult .detail');
    expect(detail.length).toBe(0);
  });

  it('positionに該当する文字列に.highlightが設定される', () => {
    props.results[0].buffer.name = 'hoge';
    props.results[0].position = {
      size: 2,
      offset: 1
    };
    const component = Enzyme.mount(<SearchResult {...props} />);

    const highlight = component.find('.searchResult .filename .highlight');
    expect(highlight.text()).toBe('og');
  });

  it('detailのpositionに該当する文字列に.highlightが設定される', () => {
    props.results[0].detail = {
      text: 'hoge',
      position: {
        size: 2,
        offset: 1
      }
    };
    const component = Enzyme.mount(<SearchResult {...props} />);

    const highlight = component.find('.searchResult .detail .highlight');
    expect(highlight.text()).toBe('og');
  });

  it('highlightの文字列が長すぎる場合、truncateされる', () => {
    props.results[0].detail = {
      text: '1234567890123456789012345678901234567890123456789012345678901234567890',
      position: {
        size: 2,
        offset: 1
      }
    };
    const component = Enzyme.mount(<SearchResult {...props} />);

    const text = component.find('.item .detail span').reduce((r, s) => {
      return r + s.text();
    }, '');
    console.log(text);
    expect(text.length).toBe(50);
  });
});
