// @flow

import React from 'react';
import {
  type SearchResult as Result,
  type Position,
} from '../../common/search';
import {
  internalPath,
} from '../../common/metadata';
import {
  type Buffer,
} from '../../common/buffer';
import FileIcon from './FileIcon';
import styles from './SearchResult.css';

type Props = {
  results: Result[],
  selectedIndex: ?number,
  onSelected: (Buffer) => any // eslint-disable-line flowtype/no-weak-types
};

export function SearchResult(props: Props) {
  const selectedIndex = props.selectedIndex;
  const onSelected = props.onSelected;

  const items = props.results.map((item, i) => {
    const buffer = item.buffer;
    const selectedClass = i === selectedIndex ? styles.selected : '';
    const itemClass = [styles.item, selectedClass].join(' ');

    return (
      <ol
        key={buffer.id}
        className={itemClass}
        role="none"
        onClick={() => onSelected(buffer)}
      >
        <div className={styles.filename}>
          <FileIcon className={styles.fileIcon} itemType={buffer.itemType} />
          {highlight(buffer.name, item.position)}
        </div>
        <div className={styles.internalPath}>
          {internalPath(buffer.repositoryName, buffer.path)}
        </div>
        {detail(item)}
      </ol>
    );
  });

  return (
    <ul className={styles.searchResult}>
      {items}
    </ul>
  );
}

function detail(result: Result) {
  if (result.detail == null) {
    return null;
  }

  return (
    <div className={styles.detail}>
      {highlight(result.detail.text, result.detail.position)}
    </div>
  );
}

const detailTextLength = 50;

function highlight(text: string, position: Position) {
  let front = text.substr(0, position.offset);
  const highlightText = text.substr(position.offset, position.size);
  let rear = text.substr(position.offset + position.size);
  if (highlightText.length >= detailTextLength) {
    front = '';
    rear = '';
  }
  const total = front.length + highlightText.length + rear.length;
  if (total >= detailTextLength) {
    const sub = detailTextLength - highlightText.length;
    front = front.substr(-sub / 2);
    rear = rear.substr(0, detailTextLength - front.length - highlightText.length);
  }

  return (
    <p>
      <span>{front}</span>
      <span className={styles.highlight}>{highlightText}</span>
      <span>{rear}</span>
    </p>
  );
}

export default SearchResult;
