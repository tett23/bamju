// @flow

export function sleep(t: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, t);
  });
}

export function deepCopy<T>(obj: T): T {
  // FIXME: そのうちちゃんとしたのにする
  return JSON.parse(JSON.stringify(obj));
}

export function deepMerge<T>(obj: T, update: Object): T {
  return Object.assign({}, deepCopy(obj), update);
}

type __ReturnType<B, F: (...any) => B> = B; // eslint-disable-line
export type $ReturnType<F> = __ReturnType<*, F>;

export default { sleep };
