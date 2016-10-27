/* eslint-env browser */
(function() {
  var HapiBrowserLogger = function() {
    var self = this;

    this.debug = false;
    this.logEndpoint = '/api/browser-log';

    var getAjaxHandler = function() {
      var xmlhttp;
      if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
      } else {
        xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
      }
      return xmlhttp;
    };

    this.sendLog = function(tags, data, cb) {
      if (!Array.isArray(tags)) {
        cb = data;
        data = tags;
        tags = [];
      }

      if (this.debug) {
        console.log('hapi-error-log', tags, data);
        if(cb) {
          cb(null, data);
        }
        return;
      }

      var ajax = getAjaxHandler();

      ajax.onreadystatechange = function() {
        if(ajax.readyState == XMLHttpRequest.DONE) {
          if(cb){
            var status = ajax.status;
            var responseData = JSON.parse(ajax.responseText);
            if(status !== 200) {
              cb("There was an error logging your data");
              return;
            }

            cb(null, responseData);
          }
        }
      };

      var dataString = JSON.stringify({ data: data, tags: tags });

      ajax.open('POST', this.logEndpoint, true);
      ajax.setRequestHeader('Content-type', 'application/json');
      ajax.send(dataString);
    };

    var errorHandler = function(err) {
      self.sendLog(['browser-error'], {
        name: err.name,
        message: err.message,
        error: {
          message: err.error.message,
          stack: err.error.stack
        }
      });
    };

    if (!window.attachEvent) {
      window.addEventListener('error', errorHandler);
    } else {
      window.attachEvent('onerror', errorHandler);
    }

    if (window.jQuery) {
      var errCb = null;

      if(jQuery.error) {
        errCb = jQuery.error;
      }

      jQuery.error = function(err) {
        self.sendLog(['jquery', 'browser-error'], { jQueryErro: err });
        if (errCb) {
          errCb();
        }
      };

      jQuery(document).ajaxError(function(event, request, settings) {
        self.sendLog(['ajax', 'browser-error'], {
          url: settings.url,
          result: event.result,
          status: request.status,
          statusText: request.statusText,
          crossDomain: settings.crossDomain,
          dataType: settings.dataType
        });
      });
    }

    return this;

  };

  window.hapiLogger = new HapiBrowserLogger();
}());
