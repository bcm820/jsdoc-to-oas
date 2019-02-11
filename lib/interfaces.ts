export interface Container {
  [key: string]: Object;
}

export interface MainServerObject {
  url: string;
  description?: string;
}

export interface ServerObject {
  root: string;
  url: string;
  description?: string;
}

export interface ConfigObject {
  title?: string;
  version?: string;
  description?: string;
  servers?: MainServerObject[];
}

export interface OptionsObject {
  servers?: ServerObject[];
  termsOfService?: string;
  contact?: Container;
  license?: Container;
}

export interface DocsContainer {
  paths: Container;
  schemas: Container;
}

export interface ParsedRouteDoc {
  route: string;
  routeObj: Container;
}

export interface TypeObject {
  type: string;
  name: string;
  expression: { name: string };
  applications: { name: string }[];
  elements: { name: string }[];
}

export interface DocLine {
  title: string;
  description: string;
  name: string;
  tags: any[];
  type: TypeObject;
  errors?: string[];
}

export interface NewDoc {
  event: DocLine[];
  tags: DocLine[];
  param: DocLine[];
  returns: DocLine[];
}

export type Predicate = (x: any) => boolean;
