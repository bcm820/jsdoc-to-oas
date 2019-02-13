import swaggerParser from 'swagger-parser';
import { checkFiles, readFiles } from './reader';
import { parseJSDocs, groupByDocType } from './parser';
import { initSpec, addCustomServers } from './builder';
import { IConfig, IOptions } from './types';
import { either } from './utils';

/**
 * Generates an OpenAPI 3 specification from parsed JSDocs in JSON format.
 */
const buildSpecFromString = async (
  docs: string,
  config: IConfig,
  options: IOptions
): Promise<any> => {
  const configs = initSpec(config, options);
  const { schemas, paths: tempPaths } = groupByDocType(parseJSDocs(docs));
  const paths = addCustomServers(tempPaths, options.servers || []);
  const components = { schemas };
  return await swaggerParser.validate({ ...configs, paths, components });
};

/**
 * Reads JSDocs from each file and concats them into a string
 * in order to call buildSpecFromString and start the parse process.
 */
const buildSpecFromFiles = async (
  docs: string[],
  config: IConfig,
  options: IOptions
): Promise<any> => {
  let readErr, parsed: string;
  const [checkErr] = await either(checkFiles(docs));
  if (!checkErr) [readErr, parsed] = await either(readFiles(docs));
  else throw Error(checkErr);
  if (readErr) throw Error(readErr);
  return await buildSpecFromString(parsed, config, options);
};

/**
 * Determines whether to read files to retrieve JSDocs prior to
 * parsing or to immediately parse the given JSDoc string.
 */
const buildSpec = (
  docs: string | string[],
  config: IConfig,
  options: IOptions
): Promise<any> =>
  Array.isArray(docs)
    ? buildSpecFromFiles(docs, config, options)
    : buildSpecFromString(docs, config, options);

export = buildSpec;
