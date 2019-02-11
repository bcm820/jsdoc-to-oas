import { parseFileContent } from 'doctrine-file';
import groupBy from 'lodash.groupby';
import partition from 'lodash.partition';
import includes from 'array-includes';
import { flatten } from './utils';

import {
  Container,
  DocsContainer,
  ParsedRouteDoc,
  DocLine,
  NewDoc,
  TypeObject,
  Predicate
} from './interfaces';

export const parseJSDocs = (ds: string): DocLine[] =>
  parseFileContent(ds, {
    unwrap: true,
    sloppy: true,
    recoverable: true,
    tags: null
  });

const includesP = (p: Predicate) => (xs: Container[]): boolean => !!xs.find(p);
const titleEquals = (exp: string) => ({ title }: DocLine): boolean =>
  title === exp;
const inclTitle = (s: string): Predicate => includesP(titleEquals(s));

export const groupByDocType = (ds: DocLine[]): DocsContainer => {
  const [routes, rest] = partition(ds, d => inclTitle('event')(d.tags));
  const schemas = rest.filter(d => inclTitle('typedef')(d.tags));
  return {
    paths: groupByRoute(parseRouteDocs(routes)),
    schemas: parseSchemaDocs(schemas)
  };
};

const parseSchemaDocs = (ss: DocLine[]): Container =>
  ss.reduce((acc: Container, s: DocLine) => {
    const [props, rest] = partition(s.tags, titleEquals('property'));
    const def = rest.find(titleEquals('typedef'));
    if (!def) throw Error(`No typedef assigned for ${s}`);
    const parseProperties = (
      acc: Container,
      { name, type, description = '' }: DocLine
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
const parseRouteDocs = (ds: DocLine[]): ParsedRouteDoc[] =>
  ds.map(d => {
    const newDoc: any = {
      ...d,
      ...groupBy(validateTags(d.tags), t => t.title)
    };
    const { event: e, tags: t, param: p, returns: r }: NewDoc = newDoc;

    // Event
    const [method, route, fn] = flatten(
      e[0].description.split(':').map(s => s.split('-'))
    ).map(s => s.trim());
    newDoc.operationId = fn;
    delete newDoc.event;

    // Tags
    if (t) newDoc.tags = t[0].description.split(',').map(s => s.trim());

    // Param
    const [body, pars] = partition(p, par => par.name.startsWith('body'));
    if (body.length)
      newDoc.requestBody = buildObj(body[0].description, body[0].type);
    if (pars.length)
      newDoc.parameters = pars.map(par => {
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
    delete newDoc.param;

    // Returns
    if (r)
      newDoc.responses = r.reduce((acc, r) => {
        const [code, desc] = r.description.split('-').map(s => s.trim());
        return { ...acc, [code]: buildObj(desc, r.type) };
      }, {});
    delete newDoc.returns;

    return {
      route,
      routeObj: { [method.toLowerCase()]: newDoc }
    };
  });

const validateTags = (ts: DocLine[]) =>
  ts.filter(({ title: t, description: d, name: n, type: ty, errors: e }) => {
    if (e) throw Error(e.join(','));
    const isEvent = t === 'event' && includes(d, ':') && includes(d, '-');
    const isTags = t === 'tags' && d;
    const isParam = t === 'param' && ty && n && includes(n, '.');
    const isReturns = t === 'returns' && d && ty;
    return !e && (isEvent || isTags || isParam || isReturns);
  });

const buildObj = (description: string = '', type: TypeObject): Container => ({
  description,
  content: {
    'application/json': {
      schema: { ...parseType(type) }
    }
  }
});

const parseType = (typeObj: TypeObject): Container => {
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

const groupByRoute = (ds: ParsedRouteDoc[]): Container =>
  ds.reduce((acc: Container, d: ParsedRouteDoc) => {
    if (d.route in acc)
      return { ...acc, [d.route]: { ...acc[d.route], ...d.routeObj } };
    else return { ...acc, [d.route]: d.routeObj };
  }, {});
