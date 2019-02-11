const buildSpec = require('../dist');
const { config, options } = require('./setup');
const docs = require('./data/string');

buildSpec(docs, config, options)
  .then(spec => console.log(JSON.stringify(spec, null, 2)))
  .catch(error => console.error(error));
