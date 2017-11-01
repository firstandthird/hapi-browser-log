const Hoek = require('hoek');
const Path = require('path');
const userAgentLib = require('useragent');

const defaults = {
  endpoint: '/api/browser-log',
  serveScript: false,
  tags: ['hapi-browser-log']
};

exports.register = function(server, options, next) {
  let settings = Hoek.clone(options);
  settings = Hoek.applyToDefaults(defaults, settings);
  const ignoreRules = [];
  const filter = data => ignoreRules.some(f => f(data));

  if (settings.ignore &&
      Array.isArray(settings.ignore) &&
      settings.ignore.length) {
    settings.ignore.forEach(ignore => {
      ignoreRules.push(value => Object.keys(ignore).some(key => {
        const regexp = new RegExp(ignore[key]);
        return regexp.exec(value[key]) !== null;
      }));
    });
  }

  }

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
      if (data.userAgent) {
        data.browser = userAgentLib.parse(data.userAgent).toString();
      }
      if (filter(data)) {
        request.server.log(tags, {
          data
        });
      }

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
