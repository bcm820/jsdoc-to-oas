const buildSpec = require('../dist');
const { config, options } = require('./setup');
const path = require('path');

const cwd = path.resolve(__dirname);
const files = [`${cwd}/data/routes.js`, `${cwd}/data/models.js`];

buildSpec(files, config, options)
  .then(spec => console.log(JSON.stringify(spec, null, 2)))
  .catch(error => console.error(error));
