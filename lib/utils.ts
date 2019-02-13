import { IPredicate } from './types';

/**
 * Flattens a deeply nested array.
 * @param {*[]} arr
 * @returns {*[]}
 */
export const flatten = (arr: any[]): any[] =>
  arr.reduce(
    (acc: any[], e: any[] | any) =>
      Array.isArray(e) ? acc.concat(flatten(e)) : acc.concat(e),
    []
  );

/**
 * Returns an array of numbers whose elements satisfy a predicate.
 * @param {*[]} arr
 * @param {IPredicate} p
 * @returns {number[]}
 */
export const findIndices = (arr: any[], p: IPredicate<any>): number[] =>
  arr.map((x, i) => (p(x) ? i : -1)).filter(x => x > -1);

/**
 * Returns a Promise that contains
 * either a success or failure value and null.
 * @async
 * @param {Promise<any>} p
 * @returns {*[]}
 */
export const either = (p: Promise<any>): Promise<any> =>
  p.then(right => [null, right]).catch(left => [left, null]);

/**
 * Tests if an array includes some element.
 * Only works for primitives (equality op).
 * @param {*} x
 * @returns {boolean}
 */
export const includes = (arr: any[], x: any): boolean =>
  !!arr.find(a => a === x);
