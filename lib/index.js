const Hoek = require('hoek');
const Path = require('path');
const defaults = {
  endpoint: '/api/browser-log',
  serveScript: false,
  tags: ['hapi-browser-log']
};

exports.register = function(server, options, next) {
  let settings = Hoek.clone(options);
  settings = Hoek.applyToDefaults(defaults, settings);

  server.route({
    method: 'POST',
    path: settings.endpoint,
    handler(request, reply) {
      if (!request.payload || !request.payload.data) {
        return reply({ success: false });
      }
      const data = request.payload.data;
      const payloadTags = request.payload.tags;
      const tags = settings.tags.concat(payloadTags);

      request.server.log(tags, {
        data,
        referrer: request.headers.referer,
        userAgent: request.headers['user-agent']
      });
      reply({ success: true });
    }
  });

  if (settings.serveScript) {
    server.dependency(['inert']);
    server.route({
      method: 'GET',
      path: '/hapi-browser-log.js',
      handler(request, reply) {
        reply.file(Path.join(__dirname, 'browser/script.js'));
      }
    });
  }

  next();
};

exports.register.attributes = {
  pkg: require('../package.json')
};
