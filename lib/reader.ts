import fs from 'fs';
import { promisify } from 'util';
import { either, findIndices } from './utils';

/**
 * Checks if all files exist at their given file paths.
 * If not, throws an Error with each invalid file path.
 */
const readFile = promisify(fs.readFile);
export const checkFiles = async (docs: string[]): Promise<void> => {
  const exists = docs.map(fp => fs.existsSync(fp));
  const notExists = findIndices(exists, b => !b);
  if (notExists.length)
    throw Error(`Not found:\n${notExists.map(i => `${docs[i]}\n`)}`);
};

/**
 * Reads the contents of all files given valid file paths.
 */
export const readFiles = async (docs: string[]): Promise<string> => {
  const dps = docs.map(d => readFile(d, 'utf8'));
  const [err, parsed] = await either(Promise.all(dps));
  if (err) throw Error(`Unable to read files: ${err}`);
  return parsed.join('\n');
};
