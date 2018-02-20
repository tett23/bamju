// @flow

import {
  type MetaDataID,
} from '../common/metadata';

export const PARSE_METADATA = 'PARSER:PARSE_METADATA';

export function parseMetaData(tabID: string, metaDataID: MetaDataID) {
  return {
    type: PARSE_METADATA,
    payload: {
      tabID,
      metaDataID
    }
  };
}
