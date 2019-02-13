import { parseFileContent } from 'doctrine-file';
import groupBy from 'lodash.groupby';
import partition from 'lodash.partition';
import { flatten, includes } from './utils';

import { IRoute, ITag, IJSDoc, IDocType, IPath, IPredicate } from './types';

export const parseJSDocs = (ds: string): ITag[] =>
  parseFileContent(ds, {
    unwrap: true,
    sloppy: true,
    recoverable: true,
    tags: null
  });

const includesP = (p: IPredicate<ITag>) => (xs: ITag[]): boolean =>
  !!xs.find(p);
const titleEquals = (exp: string): IPredicate<ITag> => ({ title }): boolean =>
  title === exp;
const inclTitle = (s: string): IPredicate<ITag[]> => includesP(titleEquals(s));

export const groupByDocType = (ds: ITag[]) => {
  const [routes, rest] = partition(ds, d => inclTitle('event')(d.tags));
  const schemas = rest.filter(d => inclTitle('typedef')(d.tags));
  return {
    paths: groupByRoute(parseRouteDocs(routes)),
    schemas: parseSchemaDocs(schemas)
  };
};

const parseSchemaDocs = (ss: ITag[]) =>
  ss.reduce((acc: object, s: ITag) => {
    const [props, rest] = partition(s.tags, titleEquals('property'));
    const def = rest.find(titleEquals('typedef'));
    if (!def) throw Error(`No typedef assigned for ${s}`);
    const parseProperties = (
      acc: object,
      { name, type, description = '' }: ITag
    ) => ({
      ...acc,
      [name]: { description, ...parseType(type) }
    });
    return {
      ...acc,
      [def.name]: {
        type: 'object',
        description: def.description || '',
        required: props
          .filter(p => p.type.type !== 'OptionalType')
          .map(p => p.name),
        properties: props.reduce(parseProperties, {})
      }
    };
  }, {});

// Flatten each AST object by assigning tags to k/v pairs
const parseRouteDocs = (ds: ITag[]): IRoute[] =>
  ds.map(d => {
    const IJSDoc: any = {
      ...d,
      ...groupBy(validateTags(d.tags), t => t.title)
    };
    const { event: e, tags: t, param: p, returns: r }: IJSDoc = IJSDoc;

    // Event
    const [method, path, fn] = flatten(
      e[0].description.split(':').map(s => s.split('-'))
    ).map(s => s.trim());
    IJSDoc.operationId = fn;
    delete IJSDoc.event;

    // Tags
    if (t) IJSDoc.tags = t[0].description.split(',').map(s => s.trim());

    // Param
    const [body, pars] = partition(p, par => par.name.startsWith('body'));
    if (body.length)
      IJSDoc.requestBody = buildObj(body[0].description, body[0].type);
    if (pars.length)
      IJSDoc.parameters = pars.map(par => {
        const [queryOrPath, name] = par.name.split('.');
        return {
          required: par.type.type !== 'OptionalType',
          description: par.description || '',
          in: queryOrPath,
          name,
          schema: {
            ...parseType(par.type)
          }
        };
      });
    delete IJSDoc.param;

    // Returns
    if (r)
      IJSDoc.responses = r.reduce((acc, r) => {
        const [code, desc] = r.description.split('-').map(s => s.trim());
        return { ...acc, [code]: buildObj(desc, r.type) };
      }, {});
    delete IJSDoc.returns;

    return {
      path,
      data: { [method.toLowerCase()]: IJSDoc }
    };
  });

const validateTags = (ts: ITag[]) =>
  ts.filter(({ title: t, description: d, name: n, type: ty, errors: e }) => {
    if (e) throw Error(e.join(','));
    const isEvent = t === 'event' && !!d.includes(':') && !!d.includes('-');
    const isTags = t === 'tags' && d;
    const isParam = t === 'param' && ty && n && !!n.includes('.');
    const isReturns = t === 'returns' && d && ty;
    return !e && (isEvent || isTags || isParam || isReturns);
  });

const buildObj = (description: string = '', type: IDocType) => ({
  description,
  content: {
    'application/json': {
      schema: { ...parseType(type) }
    }
  }
});

const parseType = (typeObj: IDocType) => {
  const { type, name, expression, applications, elements } = typeObj;
  const prims = ['integer', 'number', 'string', 'boolean'];
  switch (type) {
    case 'TypeApplication':
      const [app] = applications;
      const isPrim = includes(prims, app.name);
      return {
        type: expression.name.toLowerCase(),
        items: isPrim
          ? { type: app.name }
          : { $ref: `#/components/schemas/${app.name}` }
      };
    case 'UnionType':
      return {
        oneOf: elements.map(e =>
          includes(prims, e.name)
            ? { type: e.name }
            : { $ref: `#/components/schemas/${e.name}` }
        )
      };
    case 'NameExpression':
      if (includes(prims, name)) return { type: name };
      return { $ref: `#/components/schemas/${name}` };
    case 'OptionalType':
      return { type: expression.name };
    default:
      throw Error(`Unable to parse type: ${JSON.stringify(typeObj)}`);
  }
};

const groupByRoute = (ds: IRoute[]) =>
  ds.reduce((acc: IPath, d: IRoute) => {
    if (d.path in acc)
      return { ...acc, [d.path]: { ...acc[d.path], ...d.data } };
    else return { ...acc, [d.path]: d.data };
  }, {});
