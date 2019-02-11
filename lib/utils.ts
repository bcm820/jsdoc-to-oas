import { Predicate } from './interfaces';

/**
 * Affirms the identity of some x.
 * @param {*} x
 * @returns {*}
 */
export const identity = (x: any): any => x;

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
 * @param {Predicate} p
 * @returns {number[]}
 */
export const findIndices = (arr: any[], p: Predicate): number[] =>
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
