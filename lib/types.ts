export interface IServer {
  readonly root?: string;
  readonly url: string;
  readonly description?: string;
}

export interface IConfig {
  readonly title?: string;
  readonly version?: string;
  readonly description?: string;
  readonly servers?: IServer[];
}

export interface IOptions {
  readonly servers?: IServer[];
  readonly termsOfService?: string;
  readonly contact?: object;
  readonly license?: object;
}

export interface IRoute {
  readonly path: string;
  readonly data: object;
}

export interface IDocType {
  readonly type: string;
  readonly name: string;
  readonly expression: { name: string };
  readonly applications: { name: string }[];
  readonly elements: { name: string }[];
}

export interface ITag {
  readonly title: string;
  readonly description: string;
  readonly name: string;
  readonly tags: any[];
  readonly type: IDocType;
  readonly errors?: string[];
}

export interface IJSDoc {
  readonly event: ITag[];
  readonly tags: ITag[];
  readonly param: ITag[];
  readonly returns: ITag[];
}

export interface IPath {
  [key: string]: any;
}

export type IPredicate<T> = (x: T) => boolean;
