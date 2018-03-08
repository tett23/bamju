// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  type SearchState,
} from '../../reducers/searches';
import {
  start,
  updateQuery,
} from '../../actions/searches';
import {
  type Buffer,
} from '../../common/buffer';
import SearchProgress from './SearchProgress';
import SearchResult from './SearchResult';
import {
  type $ReturnType,
} from '../../common/util';
import styles from './Search.css';

type Props = SearchState & {
  start: (string) => $ReturnType<start>,
  updateQuery: (string, string) => $ReturnType<updateQuery>
};

class _search extends React.Component<Props> {
  inputElement: ?HTMLInputElement;
  selectedIndex: ?number;

  constructor(props: Props) {
    super(props);

    // this.setState(Object.assign({}, this.state, {
    //   selectedIndex: 0
    // }));
    // this.state.progress = props.progress || 0;
    // this.state.found = props.found || [];
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e: SyntheticInputEvent<*>) {
    const query = e.target.value;
    // this.setState(Object.assign({}, this.state, {
    //   query
    // }));
    this.props.updateQuery(this.props.queryID, query);
  }

  render() {
    const formValue = this.state ? this.state.query : this.props.query;

    const selectedIndex = this.state ? this.state.selectedIndex : null;

    return (
      <div>
        <div>
          <input
            type="text"
            className={styles.input}
            ref={(input) => { if (input) { input.focus(); } this.inputElement = input; }}
            value={formValue}
            onClick={(e) => { e.stopPropagation(); }}
            onKeyUp={e => {
              return checkKeys(e, this.props.queryID, this.selectedIndex, this.props, this.state, this.setState.bind(this));
            }}
            onChange={this.handleChange}
            placeholder="query"
          />
        </div>
        <SearchProgress
          progress={this.props.progress}
          completed={this.props.completed}
        />
        <SearchResult
          results={this.props.results}
          selectedIndex={selectedIndex}
          onSelected={searchResultOnSelected}
        />
      </div>
    );
  }
}

function checkKeys(e: SyntheticInputEvent<HTMLInputElement>, queryID: string, selectedIndex: ?number, dispatch, state, setState) {
  e.stopPropagation();

  // CmdOrCtrl + Enterで開くのかな

  if (e.key === 'Enter') {
    dispatch.start(queryID);
    return false;
  } else if (e.key === 'Up') {
    setState(Object.assign({}, state, {
      selectedIndex: (selectedIndex || 0) - 1
    }));
  } else if (e.key === 'Down') {
    setState(Object.assign({}, state, {
      selectedIndex: (selectedIndex || 0) + 1
    }));
  }

  return true;
}

function searchResultOnSelected(buffer: Buffer): void {

}

function mapDispatchToProps(dispatch) {
  return {
    start: (queryID: string) => {
      return dispatch(start(queryID));
    },
    updateQuery: (queryID: string, query: string) => {
      return dispatch(updateQuery(queryID, query));
    }
  };
}

export const Search = connect(null, mapDispatchToProps)(_search);
export default Search;
