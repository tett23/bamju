// @flow

import React from 'react';
import {
  type SearchState,
} from '../../reducers/searches';
import styles from './Search.css';

type Props = SearchState;

class _search extends React.Component<Props> {
  inputElement: ?HTMLInputElement;

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

    return (
      <div>
        <input
          type="text"
          className={styles.input}
          ref={(input) => { if (input) { input.focus(); } this.inputElement = input; }}
          value={formValue}
          onClick={(e) => { e.stopPropagation(); }}
          onKeyUp={e => {
            return checkEnter(e, dispatch);
          }}
          onChange={this.handleChange}
          placeholder="query"
        />
      </div>
    );
  }
}

function checkEnter(e: SyntheticInputEvent<HTMLInputElement>, query, dispatch) {
  e.stopPropagation();

  if (e.key === 'Enter') {
    dispatch.query(e.target.value);
    return false;
  } else if (e.key === 'Escape') {
    return false;
  }

  return true;
}

// function mapStateToProps(state: State) {
//   state
// }

export const Search = _search;
export default Search;
