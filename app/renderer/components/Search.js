// @flow

import React from 'react';
import {
  type SearchState,
} from '../../reducers/searches';
import {
  start
} from '../../actions/searches';
import {
  type Buffer,
} from '../../common/buffer';
import SearchProgress from './SearchProgress';
import SearchResult from './SearchResult';
import styles from './Search.css';

type Props = SearchState;

class _search extends React.Component<Props> {
  inputElement: ?HTMLInputElement;
  selectedIndex: ?number;

  // constructor(props: Props) {
  //   super(props);
  //
  //   // this.state.queryID = props.queryID;
  //   // this.state.progress = props.progress || 0;
  //   // this.state.found = props.found || [];
  // }

  handleChange(e: SyntheticInputEvent<*>) {
    this.setState(Object.assign({}, this.state, {
      query: e.target.value
    }));
  }

  render() {
    const formValue = this.state ? this.state.query : this.props.query;

    const dispatch = this.dispatch;
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
              return checkKeys(e, formValue, dispatch, this.state || {}, this.setState);
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

function checkKeys(e: SyntheticInputEvent<HTMLInputElement>, query, dispatch, state, setState) {
  e.stopPropagation();

  // CmdOrCtrl + Enterで開くのかな

  if (e.key === 'Enter') {
    dispatch(start('', e.target.value));
    return false;
  } else if (e.key === 'Up') {
    setState(Object.assign({}, state, {
      selectedIndex: (state.selectedIndex || 0) - 1
    }));
  } else if (e.key === 'Down') {
    setState({
      selectedIndex: (state.selectedIndex || 0) + 1
    });
  }

  return true;
}

function searchResultOnSelected(buffer: Buffer): void {

}

// function mapStateToProps(state: State) {
//   state
// }

export const Search = _search;
export default Search;
