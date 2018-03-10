// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  type SearchState,
} from '../../reducers/searches';
import {
  start,
  updateQuery,
  updateSelectedIndex,
} from '../../actions/searches';
import {
  addOrActiveTab,
} from '../../actions/browser';
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
  updateQuery: (string, string) => $ReturnType<updateQuery>,
  updateSelectedIndex: (string, ?number)=>$ReturnType<updateSelectedIndex>
};

class _search extends React.Component<Props> {
  inputElement: ?HTMLInputElement;
  handleChange: (SyntheticInputEvent<*>) => void;

  constructor(props: Props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e: SyntheticInputEvent<*>) {
    const query = e.target.value;
    this.props.updateQuery(this.props.queryID, query);
  }

  render() {
    const formValue = this.state ? this.state.query : this.props.query;

    const selectedIndex = this.props.selectedIndex || 0;

    return (
      <div className={styles.search}>
        <label
          className={styles.label}
          htmlFor={`searchInput${this.props.queryID}`}
        >
          <p>Search</p>
          <input
            type="text"
            id={`searchInput${this.props.queryID}`}
            className={styles.input}
            ref={(input) => { if (input) { input.focus(); } this.inputElement = input; }}
            value={formValue}
            onClick={(e) => { e.stopPropagation(); }}
            onKeyDown={e => {
              return checkKeys(e, this.props);
            }}
            onChange={this.handleChange}
            placeholder="query"
          />
        </label>
        <SearchProgress
          progress={this.props.progress}
          completed={this.props.completed}
        />
        <SearchResult
          results={this.props.results}
          selectedIndex={selectedIndex}
          onSelected={() => { searchResultOnSelected(this.props); }}
        />
      </div>
    );
  }
}

function checkKeys(e: SyntheticInputEvent<HTMLInputElement>, props: Props) {
  e.stopPropagation();

  const selectedIndex = props.selectedIndex || 0;

  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    const result = props.results[selectedIndex];
    if (result == null) {
      return false;
    }
    searchResultOnSelected(props)(result.buffer);
  } else if (e.key === 'Enter') {
    props.start(props.queryID);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    props.updateSelectedIndex(props.queryID, selectedIndex - 1);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    props.updateSelectedIndex(props.queryID, selectedIndex + 1);
  }
}

function searchResultOnSelected(props: Props): (Buffer)=>void {
  return (buffer: Buffer) => {
    props.addOrActiveTab(props.queryID, buffer);
  };
}

function mapDispatchToProps(dispatch) {
  return {
    start: (queryID: string) => {
      return dispatch(start(queryID));
    },
    addOrActiveTab: (queryID: string, buffer: Buffer) => {
      dispatch(addOrActiveTab(buffer.id));
      return dispatch(close(queryID));
    },
    updateQuery: (queryID: string, query: string) => {
      return dispatch(updateQuery(queryID, query));
    },
    updateSelectedIndex: (queryID: string, selectedIndex: ?number) => {
      return dispatch(updateSelectedIndex(queryID, selectedIndex));
    }
  };
}

export const Search = connect(null, mapDispatchToProps)(_search);
export default Search;
