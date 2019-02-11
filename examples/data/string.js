module.exports = `

/**
* Get an array of Todos.
* @event GET: /todos - getTodos
* @returns {Todo[]} 200 - An array of todos
* @returns {Error} 500 - Server Error
*/

/**
 * @typedef Todo
 * @property {string} id - A unique identifier
 * @property {string[]} descriptions - What needs to be done
 * @property {boolean} [isDone] - The Todo's status
 */

/**
 * @typedef Error
 * @property {string} message - The error message
 */

`;
