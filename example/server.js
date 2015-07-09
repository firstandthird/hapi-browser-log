var Hapi = require('hapi');
var Path = require('path');


var server = new Hapi.Server();

server.connection({ port: process.argv[2] || 3000 });

console.log(Path.join(__dirname, 'templates'));

server.views({
  engines: {
    html: require('handlebars')
  },
  relativeTo: __dirname, 
  path: './views' 
});

server.route({
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    reply.view('main');
  }
});

server.register({register: require('../')}, function(err) {
  if(err) {
    console.log('Failed to load plugin', err);

  }

  server.start(function() {
    console.log('Server Started');
  });

});
