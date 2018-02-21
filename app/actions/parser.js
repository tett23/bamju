// @flow

import { type Meta } from '../reducers/types';
import {
  type MetaDataID,
} from '../common/metadata';

export const PARSE_METADATA = 'PARSER:PARSE_METADATA';
export const PARSE_INTERNAL_PATH = 'PARSER:PARSE_INTERNAL_PATH';

export function parseMetaData(tabID: string, metaDataID: MetaDataID, meta: Meta = {}) {
  return {
    type: PARSE_METADATA,
    payload: {
      tabID,
      metaDataID
    },
    meta
  };
}

export function parseInternalPath(tabID: string, internalPath: string, meta: Meta = {}) {
  return {
    type: PARSE_INTERNAL_PATH,
    payload: {
      tabID,
      internalPath
    },
    meta
  };
}
