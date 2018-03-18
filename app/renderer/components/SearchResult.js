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
          {buffer.name}
        </div>
        <div className={styles.internalPath}>
          {highlight(internalPath(buffer.repositoryName, buffer.path), item.positions, buffer.repositoryName.length + 1)}
        </div>
        {detail(item)}
      </ol>
    );
  });

  return (
    <ul
      className={styles.searchResult}
      ref={(item) => scrollItem(item, selectedIndex)}
    >
      {items}
    </ul>
  );
}

function scrollItem(ul, selectedIndex) {
  if (ul == null) {
    return;
  }
  if (selectedIndex == null) {
    ul.scrollTop = 0; // eslint-disable-line no-param-reassign
    return;
  }

  const olItems = ul.querySelectorAll('ol');
  const ol = olItems[selectedIndex];
  if (ol == null) {
    ul.scrollTop = 0; // eslint-disable-line no-param-reassign
    return;
  }

  ul.scrollTop = ol.offsetTop - ul.offsetTop; // eslint-disable-line no-param-reassign
}

function detail(result: Result) {
  if (result.detail == null) {
    return null;
  }

  return (
    <div className={styles.detail}>
      {detailHighlight(result.detail.text, result.detail.positions)}
    </div>
  );
}

type HighlightChunk = {
  character: string,
  highlighted: boolean
};

function highlight(text: string, positions: Position[], offset?: number = 0) {
  console.log('highlight', text, positions);
  const chunks = text.split('').map((c): HighlightChunk => {
    return {
      character: c,
      highlighted: false
    };
  });

  positions.forEach((pos) => {
    for (let i = 0; i < pos.size; i += 1) {
      const idx = i + pos.offset + offset;
      chunks[idx].highlighted = true;
    }
  });

  return renderHighlight(chunks);
}

function detailHighlight(text: string, positions: Position[]) {
  const items = positions.map((pos) => {
    return highlight(text, [pos]);
  }).map((item) => {
    return <li>{item}</li>;
  });

  return <ul>{items}</ul>;
}

function renderHighlight(chunks: HighlightChunk[]) {
  const spans = chunks.map((chunk) => {
    const cls = chunk.highlighted ? styles.highlight : '';

    return (
      <span className={cls}>
        {chunk.character}
      </span>
    );
  });

  return (
    <p>{spans}</p>
  );
}

export default SearchResult;
