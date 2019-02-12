import { parseFileContent } from 'doctrine-file';
import groupBy from 'lodash.groupby';
import partition from 'lodash.partition';
import { flatten, includes } from './utils';

import { Route, Tag, JSDoc, DocType, Path, Predicate } from './types';

export const parseJSDocs = (ds: string): Tag[] =>
  parseFileContent(ds, {
    unwrap: true,
    sloppy: true,
    recoverable: true,
    tags: null
  });

const includesP = (p: Predicate<Tag>) => (xs: Tag[]): boolean => !!xs.find(p);
const titleEquals = (exp: string): Predicate<Tag> => ({ title }): boolean =>
  title === exp;
const inclTitle = (s: string): Predicate<Tag[]> => includesP(titleEquals(s));

export const groupByDocType = (ds: Tag[]) => {
  const [routes, rest] = partition(ds, d => inclTitle('event')(d.tags));
  const schemas = rest.filter(d => inclTitle('typedef')(d.tags));
  return {
    paths: groupByRoute(parseRouteDocs(routes)),
    schemas: parseSchemaDocs(schemas)
  };
};

const parseSchemaDocs = (ss: Tag[]) =>
  ss.reduce((acc: Object, s: Tag) => {
    const [props, rest] = partition(s.tags, titleEquals('property'));
    const def = rest.find(titleEquals('typedef'));
    if (!def) throw Error(`No typedef assigned for ${s}`);
    const parseProperties = (
      acc: Object,
      { name, type, description = '' }: Tag
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
const parseRouteDocs = (ds: Tag[]): Route[] =>
  ds.map(d => {
    const JSDoc: any = {
      ...d,
      ...groupBy(validateTags(d.tags), t => t.title)
    };
    const { event: e, tags: t, param: p, returns: r }: JSDoc = JSDoc;

    // Event
    const [method, path, fn] = flatten(
      e[0].description.split(':').map(s => s.split('-'))
    ).map(s => s.trim());
    JSDoc.operationId = fn;
    delete JSDoc.event;

    // Tags
    if (t) JSDoc.tags = t[0].description.split(',').map(s => s.trim());

    // Param
    const [body, pars] = partition(p, par => par.name.startsWith('body'));
    if (body.length)
      JSDoc.requestBody = buildObj(body[0].description, body[0].type);
    if (pars.length)
      JSDoc.parameters = pars.map(par => {
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
    delete JSDoc.param;

    // Returns
    if (r)
      JSDoc.responses = r.reduce((acc, r) => {
        const [code, desc] = r.description.split('-').map(s => s.trim());
        return { ...acc, [code]: buildObj(desc, r.type) };
      }, {});
    delete JSDoc.returns;

    return {
      path,
      data: { [method.toLowerCase()]: JSDoc }
    };
  });

const validateTags = (ts: Tag[]) =>
  ts.filter(({ title: t, description: d, name: n, type: ty, errors: e }) => {
    if (e) throw Error(e.join(','));
    const isEvent = t === 'event' && !!d.includes(':') && !!d.includes('-');
    const isTags = t === 'tags' && d;
    const isParam = t === 'param' && ty && n && !!n.includes('.');
    const isReturns = t === 'returns' && d && ty;
    return !e && (isEvent || isTags || isParam || isReturns);
  });

const buildObj = (description: string = '', type: DocType) => ({
  description,
  content: {
    'application/json': {
      schema: { ...parseType(type) }
    }
  }
});

const parseType = (typeObj: DocType) => {
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

const groupByRoute = (ds: Route[]) =>
  ds.reduce((acc: Path, d: Route) => {
    if (d.path in acc)
      return { ...acc, [d.path]: { ...acc[d.path], ...d.data } };
    else return { ...acc, [d.path]: d.data };
  }, {});
