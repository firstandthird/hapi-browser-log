var Hoek = require('hoek');
var Path = require('path');
var defaults = {
  endpoint: '/api/browser-log',
  tags: ['hapi-browser-log']
};

exports.register = function(server, options, next) {
  var self = this;

  this.settings = Hoek.clone(options);
  this.settings = Hoek.applyToDefaults(defaults, this.settings);
  
  server.route({
    method: 'POST',
    path: this.settings.endpoint,
    handler: function(request, reply) {
      var data = request.payload;
      request.server.log(self.settings.tags, data);
      reply({success: true});
    }
  });
 
  server.route({
    method: 'GET',
    path: '/hapi-browser-log.js',
    handler: function (request, reply) {
      reply.file(Path.join(__dirname, 'assets/script.js'));
    }
  });
 
  next();
};

exports.register.attributes = {
  pkg: require('../package.json')
};
