// Revealing module pattern (https://learn.jquery.com/code-organization/concepts/)

window.APP = (function (module, $) {
  "use strict";

  var loader = (function() {

    var $context;

    function generateMarkup() {
      var markup = '<div class="loader"><div class="loader-icon"><i class="fas fa-circle-notch fa-spin"></i></div><p class="loader-message"></p></div>';
      return $(markup);
    }

    function init(_$context) {
      var $loader = generateMarkup();
      $context = _$context;

      $context.addClass('loader-container').append($loader)
    }

    function start(loadingMessage, fakeDelay) {
      var message = loadingMessage ? loadingMessage + '...' : 'Loading...';

      $('.loader', $context)
        .addClass('is-active')
        .find('.loader-message').text(message);

      if(fakeDelay) {
        setTimeout(function() {
          stop();
        }, 1500);
      }
    }

    function stop() {
      $('.loader', $context)
        .removeClass('is-active');
    }

    return {
      init: init,
      start: start,
      stop: stop
    }
    
  }());

  module.loader = loader;

  return module;
    

})(window.APP || {}, window.jQuery);