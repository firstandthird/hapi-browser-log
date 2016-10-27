;(function() {
  
  var HapiBrowserLogger = function() {

    var self = this;

    this.debug = false;
    this.logEndpoint = '/api/browser-log';

    var getAjaxHandler = function() {
      var xmlhttp;
      if(window.XMLHttpRequest) {
       xmlhttp = new XMLHttpRequest();
      } else { 
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
      }
      return xmlhttp;
    };

    var dataToString = function(data) {
      var qr = [];
      for (var key in data) {
        qr.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
      }

      return qr.join('&');
      
    };

    this.sendLog = function(data, cb) {

      if(this.debug) {
        console.log('hapi-error-log', data);
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
      
      var queryData = dataToString(data);

      ajax.open("POST", this.logEndpoint, true);
      ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
      ajax.send(queryData);
    };
    
    var errorHandler = function(err) {
      self.sendLog(err);
    };

    if (!window.attachEvent) {
      window.addEventListener('error', errorHandler);
    } else {
      window.attachEvent('onerror', errorHandler);
    }
    
    if(window.jQuery) {
      var errCb = null;

      if(jQuery.error) {
        errCb = jQuery.error;
      }
      
      jQuery.error = function(err) {
        self.sendLog({jQueryErro: err});
        if(errCb) {
          errCb();
        }
      };

      jQuery(document).ajaxError(function(event, request, settings) {
        self.sendLog({
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

})();
