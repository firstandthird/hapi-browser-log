const Hoek = require('hoek');
const Path = require('path');
const userAgentLib = require('useragent');

const defaults = {
  endpoint: '/api/browser-log',
  serveScript: false,
  tags: ['hapi-browser-log'],
  routeConfig: {}
};

const register = function(server, options) {
  let settings = Hoek.clone(options);
  settings = Hoek.applyToDefaults(defaults, settings);
  let filter = () => true;

  if (settings.ignore &&
      Array.isArray(settings.ignore) &&
      settings.ignore.length) {
    filter = data => {
      let isLoggable = true;

      const checkIgnore = (ignore, value) =>
        Object.keys(ignore).some(key => {
          const regexp = new RegExp(ignore[key]);

          return regexp.exec(value[key]) !== null;
        });

      for (let i = 0, len = settings.ignore.length; i < len && isLoggable; i++) {
        isLoggable = !checkIgnore(settings.ignore[i], data);
      }

      return isLoggable;
    };
  }

  const route = {
    method: 'POST',
    path: settings.endpoint,
    handler(request, h) {
      if (!request.payload || !request.payload.data) {
        return { success: false };
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

      return { success: true };
    }
  };

  server.route(Hoek.applyToDefaults(route, settings.routeConfig));

  if (settings.serveScript) {
    server.dependency(['inert']);
    server.route({
      method: 'GET',
      path: '/hapi-browser-log.js',
      handler(request, h) {
        return h.file(Path.join(__dirname, '/lib/browser/script.js'));
      }
    });
  }
};

exports.plugin = {
  name: 'hapi-browser-log',
  register,
  once: true,
  pkg: require('./package.json')
};
