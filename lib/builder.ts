import { Server, Config, Options } from './interfaces';

/**
 * Initializes the OpenAPI spec with given configuration and options.
 */
export const initSpec = (config: Config = {}, options: Options = {}) => {
  if (!config.servers && !options.servers)
    throw Error('Server(s) not specified for all paths!');

  const info = {
    title: config.title || '',
    version: config.version || '',
    description: config.description || ''
  } as {
    title: string;
    version: string;
    description: string;
    termsOfService?: string;
    contact?: Object;
    license?: Object;
  };

  if (options.termsOfService) info.termsOfService = options.termsOfService;
  if (options.contact) info.contact = options.contact;
  if (options.license) info.license = options.license;

  return {
    openapi: '3.0.2',
    info,
    servers: config.servers || []
  };
};

/**
 * Applies custom servers for given paths (e.g. for testing across servers).
 */
export const addCustomServers = (pathObjs: Object, servers: Server[]) => {
  Object.keys(pathObjs).forEach(k => {
    const s = servers.find(s => k.startsWith(s.root as string));
    if (s)
      pathObjs[k].servers = [{ url: s.url, description: s.description || '' }];
  });
  return pathObjs;
};
