export interface Server {
  readonly root?: string;
  readonly url: string;
  readonly description?: string;
}

export interface Config {
  readonly title?: string;
  readonly version?: string;
  readonly description?: string;
  readonly servers?: Server[];
}

export interface Options {
  readonly servers?: Server[];
  readonly termsOfService?: string;
  readonly contact?: Object;
  readonly license?: Object;
}

export interface Route {
  readonly path: string;
  readonly data: Object;
}

export interface DocType {
  readonly type: string;
  readonly name: string;
  readonly expression: { name: string };
  readonly applications: { name: string }[];
  readonly elements: { name: string }[];
}

export interface Tag {
  readonly title: string;
  readonly description: string;
  readonly name: string;
  readonly tags: any[];
  readonly type: DocType;
  readonly errors?: string[];
}

export interface JSDoc {
  readonly event: Tag[];
  readonly tags: Tag[];
  readonly param: Tag[];
  readonly returns: Tag[];
}

export type Predicate<T> = (x: T) => boolean;
