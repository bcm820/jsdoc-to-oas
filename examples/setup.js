const config = {
  title: 'Example API',
  version: '1.2.3',
  description: 'This is an optional single/multi-line description',
  servers: [
    {
      url: 'https://api.example.com/v1',
      description: 'Production server (uses live data)'
    },
    {
      url: 'https://sandbox-api.example.com/v1',
      description: 'Sandbox server (uses test data)'
    }
  ]
};

const options = {
  termsOfService: 'https://api.example.com/tos',
  contact: {
    name: 'API Support',
    url: 'http://www.example.com/support',
    email: 'support@example.com'
  },
  license: {
    name: 'Apache 2.0',
    url: 'http://www.apache.org/licenses/LICENSE-2.0.html'
  },
  servers: [
    {
      root: '/todos',
      url: 'http://todoDomain.example.com/v1',
      description: 'Alternate server override'
    }
  ]
};

module.exports = {
  config,
  options
};
