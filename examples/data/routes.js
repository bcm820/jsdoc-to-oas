/**
 * Get an array of Todos.
 * @event GET: /todos - getTodos
 * @returns {Todo[]} 200 - An array of todos
 * @returns {Error} 500 - Server Error
 */
const getTodos = (_, res) =>
  todos
    .findAll()
    .then(todos => res.json(todos))
    .catch(err =>
      res.status(500).json({
        message: JSON.stringify(err)
      })
    );
app.get('/todos', getTodos);
