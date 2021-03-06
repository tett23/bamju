// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import {
  type Buffer
} from '../../common/buffer';
import {
  ItemTypeUndefined,
  internalPath,
} from '../../common/metadata';
import { parseInternalPath } from '../../actions/parser';
import {
  type $ReturnType,
} from '../../common/util';
import path from '../../common/path';
import FileIcon from './FileIcon';
import styles from './FileHeader.css';

type Props = {
  buffer: ?Buffer,
  tabID: string,
  isEdited: boolean
} & $ReturnType<typeof mapDispatchToProps>;

function _fileHeader(props: Props) {
  let itemPath;
  let name;
  let itemType;
  let repositoryName;
  if (props.buffer == null) {
    itemPath = '/';
    name = 'undefined';
    itemType = ItemTypeUndefined;
    repositoryName = '';
  } else {
    itemPath = props.buffer.path;
    itemType = props.buffer.itemType;
    repositoryName = props.buffer.repositoryName;
    name = path.basename(props.buffer.path);
  }

  const tabID = props.tabID;

  const pathItems = [];
  if (repositoryName !== '') {
    pathItems.push((
      <li
        key={repositoryName}
        className={[styles.pathItem, styles.repositoryItem].join(' ')}
      >
        <span
          role="none"
          onClick={(_) => pathItemOnClick(tabID, repositoryName, '/', props)}
        >
          {repositoryName}
        </span>
      </li>
    ));
  }
  const arr = path.split(path.dirname(itemPath)).filter((item) => { return item !== ''; });
  arr.forEach((item) => {
    pathItems.push((
      <li
        key={[repositoryName, item].join('/')}
        className={[styles.pathItem, styles.dirItem].join(' ')}
      >
        <span
          role="none"
          onClick={(_) => pathItemOnClick(tabID, repositoryName, item, props)}
        >
          {item}
        </span>
      </li>
    ));
  });
  pathItems.push((
    <li
      key={[repositoryName, itemPath, name].join('/')}
      className={[styles.pathItem, styles.baseItem].join(' ')}
    >
      <span>{name}</span>
    </li>
  ));

  return (
    <div className={styles.fileHeader}>
      <FileIcon itemType={itemType} />
      <ul className={styles.fileName}>{pathItems}</ul>
      {edited(props.isEdited)}
    </div>
  );
}

function edited(isEdited: boolean) {
  if (isEdited === false) {
    return;
  }

  return <span className={styles.isEdited}>(edited)</span>;
}

function pathItemOnClick(tabID: string, repositoryName: string, itemPath: string, dispatcher: $ReturnType<typeof mapDispatchToProps>) {
  dispatcher.parseInternalPath(tabID, internalPath(repositoryName, itemPath));
}

function mapDispatchToProps(dispatch) {
  return {
    parseInternalPath: (tabID: string, _internalPath: string) => {
      return dispatch(parseInternalPath(tabID, _internalPath));
    },
  };
}

export const FileHeader = connect(null, mapDispatchToProps)(_fileHeader);

export default FileHeader;
