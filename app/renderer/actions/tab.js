// @flow

export const OPEN_PAGE = 'OPEN_PAGE';

export type page = {
  body: string
};

export function openPageByBodyString(body: string) {
  return {
    type: OPEN_PAGE,
    page: {
      body
    }
  };
}
