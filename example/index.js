/* eslint-disable no-console */
const Hapi = require('hapi');

const startServer = async function() {
  const server = new Hapi.Server({
    debug: {
      log: ['hapi-browser-log']
    },
    port: process.argv[2] || 3000
  });

  server.route({
    method: 'GET',
    path: '/',
    handler(request, h) {
      return h.view('main');
    }
  });

  await server.register(require('vision'));
  await server.register(require('inert'));
  await server.register({
    plugin: require('../'),
    options: {
      serveScript: true,
      endpoint: '/api/errors-logs'
    }
  });

  server.views({
    engines: {
      html: require('handlebars')
    },
    relativeTo: __dirname,
    path: './views'
  });

  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
};

startServer();
