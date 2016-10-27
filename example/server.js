/* eslint-disable no-console */
const Hapi = require('hapi');

const server = new Hapi.Server({
  debug: {
    log: ['hapi-browser-log']
  }
});

server.connection({ port: process.argv[2] || 3000 });

server.route({
  method: 'GET',
  path: '/',
  handler(request, reply) {
    reply.view('main');
  }
});

server.register([
  { register: require('vision') },
  { register: require('inert') },
  {
    register: require('../'),
    options: {
      serveScript: true
    }
  },
], (err) => {
  if (err) {
    throw err;
  }

  server.views({
    engines: {
      html: require('handlebars')
    },
    relativeTo: __dirname,
    path: './views'
  });

  server.start((serverErr) => {
    if (serverErr) {
      throw serverErr;
    }
    console.log('Server Started');
  });
});
