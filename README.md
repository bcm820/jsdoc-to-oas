# JSDoc to Swagger Documentation (OpenAPI)

**jsdoc-to-swaggerdoc** is a tool for Node.js-based RESTful API service developers to automate their documentation writing process from the start of their development process.

It parses [JSDoc](http://usejsdoc.org)-like syntax into an [Swagger/OpenAPI Specification](https://swagger.io/docs/specification/about/), a standardized way of describing RESTful APIs. By documenting your code with comments like the following,

```
/**
 * Get an array of Todos.
 * @event GET: /todos - getTodos
 * @returns {Todo[]} 200 - An array of todos
 * @returns {Error} 400 - Bad Request
 */
```

...you can generate interactive API documentation using tools such as [Swagger UI](https://swagger.io/tools/swagger-ui/) that allow you to test out your endpoints without ever running a curl command.

---

## Getting Started

```
npm install jsdoc-to-swaggerdoc
```

```
const buildSpec = require('jsdoc-to-swaggerdoc');

const filesToRead = ['./routes.js', './models.js']
const config = {
  title: 'My Todos API',
  version: '1.0.0',
  servers: [{
    url: 'https://api.server.com',
    description: 'My main web server'
  }]
}

app.get('/docs', (req, res) => {
  buildSpec(filesToRead, config)
    .then(res.json)
    .catch(console.error)
})
```

---

## Documentation Guide

Every JSDoc block that defines a route should have at least:

An `@event` tag listing the request method, route path, and the name of the handler function to be called when the route is visited. Note the route path has an interpolated path variable.

```
 * @event GET: /todos/{todoId} - getTodoById
```

Several `@returns` tags for each response type, listing the type of object being returned with each status code, and an optional description for each code.

```
 * @returns {Todo} 200 - A Todo object
 * @returns {Error} 400 - Bad Request
 * @returns {Error} default
```

Depending on the type of request being made, `@param` tags may be used to define a request body, query string, or path parameter. See the following examples:

```
// For GET `/todos/{todoId}`

* @param {string} path.todoId
```

```
// For GET `/todos?size=10&completed=true`
// Note: the square brackets denote an optional param

* @param {number} query.size - Max amount to return
* @param {boolean} [query.completed] - Is it done?
```

```
// For POST `/todos` with a request body

 * @param {Todo} body.Todo - A new Todo
```

Note the pattern: `{Type} paramType.Name - Description`.

An optional `@tags` array may be specified for adding keywords that can be used to categorize various routes in the UI.

Lastly, any descriptions are added to the top of the JSDoc block without a tag.

```
 * @tags todos, tasks, stuff
```

Schemas also need to be described and parsed if referenced in your documentation (e.g. `Todo` and `Error`). Otherwise, an error will be thrown when trying to validate your documentation.

Declaring a schema is as easy as adding a `@typedef` with several `@property` tags:

```
/**
 * @typedef Todo
 * @property {string} todoId
 * @property {string[]} descriptions - What to do
 * @property {boolean} [completed]
 */
```

---

## Building the OpenAPI Specification

**buildSpec** takes three arguments:

- An array of file paths OR a string with JSDoc syntax
- A configuration object
- An options object

Here are its two signatures (depending on if using an array of file paths or string of docs):

```
function buildSpec(filePaths: string[], config: Object, options: Object): Spec

function buildSpec(docs: string, config: Object, options: Object): Spec
```

### File Paths

These files will be read and parsed one by one from left to right. Note that any repeated route paths will overwrite the previous document block!

```
['./routes/user.js', './routes/todos.js']
```

### String of JSDoc syntax

You may optionally pass in a string with the JSDoc syntax if you prefer to read the files yourself. Any JSDoc syntax blocks will be detected, and all other text ignored:

```
/**
 * Get an array of Todos.
 * @event GET: /todos - getTodos
 * @returns {Todo[]} 200 - An array of todos
 * @returns {Error} 400 - Bad Request
 */
 **THIS WILL BE IGNORED!!!**
 /**
 * Create a Todo.
 * @event POST: /todos - addTodo
 * @param {Todo} body.Todo - A new Todo
 * @returns {Todo} 200 - Created Todo
 * @returns {Error} 400 - Bad Request
 */
```

### Configuration Object

For information on what fields are used in the configuration object, see the [OpenAPI spec documentation](https://swagger.io/specification/#infoObject). Note that `servers` is an array, meaning multiple servers can be specified.

```
{
  title: 'My Todos API',
  version: '1.0.0',
  description: 'This is my Todos API',
  servers: [
    {
      url: 'https://dev.server.com',
      description: 'Development server'
    },
    {
      url: 'https://api.server.com',
      description: 'Production server'
    }
  ]
}
```

### Options Object

The options object has a few miscellaneous items to describe, with more to come in future releases. Note that `servers` shows up again, but this time each server object has an additional `root` key...

```
{
  termsOfService: 'https://www.server.com/terms',
  contact: {
    name: 'API Support',
    url: 'http://www.server.com/support',
    email: 'support@server.com'
  },
  license: {
    name: 'Apache 2.0',
    url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
  },
  servers: [
    {
      root: '/todos',
      url: 'https://todos.server.com,
      description: 'Separate Todos server'
    }
  ]
}
```

This allows you to specify path-specific servers to use. The `root` field identifies any defined route path that starts with `/todos` and uses the provided server information. This means multiple services (i.e. microservices) can be tested and interacted with from one single generated API specification!

---

## Questions?

More information to come in the future. Please feel free to contact me if you have any questions about using this tool.
