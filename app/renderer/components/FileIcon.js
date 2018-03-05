// @flow

import * as React from 'react';
import FontAwesome from 'react-fontawesome';

import {
  type ItemType,
  ItemTypeMarkdown,
  ItemTypeText,
  ItemTypeDirectory,
  ItemTypeRepository,
  ItemTypeCSV,
  ItemTypeTSV,
  ItemTypeHTML,
} from '../../common/metadata';

type Props = {
  itemType: ItemType,
  isOpened?: boolean,
  onClick?: null | (any) => any // eslint-disable-line flowtype/no-weak-types
};

export function Icon(props: Props) {
  switch (props.itemType) {
  case ItemTypeRepository:
    return <FontAwesome name="database" onClick={props.onClick} />;
  case ItemTypeDirectory:
    if (props.isOpened) {
      return <FontAwesome name="folder-open" onClick={props.onClick} />;
    }
    return <FontAwesome name="folder" onClick={props.onClick} />;
  case ItemTypeMarkdown:
    return <FontAwesome name="file-text" onClick={props.onClick} />;
  case ItemTypeText:
    return <FontAwesome name="file-text" onClick={props.onClick} />;
  case ItemTypeCSV:
    return <FontAwesome name="file-text" onClick={props.onClick} />;
  case ItemTypeTSV:
    return <FontAwesome name="file-text" onClick={props.onClick} />;
  case ItemTypeHTML:
    return <FontAwesome name="file-text" onClick={props.onClick} />;
  default:
    return <FontAwesome name="question-circle" onClick={props.onClick} />;
  }
}

export default Icon;
