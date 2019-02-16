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

  var datePicker = (function() {

    $.datepicker.setDefaults({
      dateFormat: 'dd-M-yy',
      maxDate: new Date(),
      changeMonth: true,
      changeYear: true,
      altFormat: "yy-mm-dd",
      showOn: "both",
      buttonImage: "/images/calendar.png",
      buttonImageOnly: true
    });

    function init(dateFieldId, altFieldId) {
      var $dateField = $(dateFieldId);
      // overlay the datepicker input to prevent the virtual keyboard showing on mobiles
      var $mask = $dateField.parent().find('.datepicker-mask');
      var isOpen = false;

       //check we have not already applied this !
      if ($dateField.hasClass('hasDatepicker') === false) {
          
        $dateField.datepicker();

        if(altFieldId)
          $dateField.datepicker("option", "altField", altFieldId);

        //fire change event if new date entered
        $dateField.datepicker({
          onSelect: function (d, i) {
              if (d !== i.lastVal) {
                  $(this).change();
              }
          }
        }); 

        $mask.on('click', function() {
          if(isOpen) {
            $dateField.datepicker('hide');
            isOpen = false;
          }
          else {
            $dateField.datepicker('show');
            isOpen = true;
          }
        })
      }
      else {
        return null;
      }
    }

    return {
      init: init
    }
    
  }());

  module.datePicker = datePicker;

  return module;
    

})(window.APP || {}, window.jQuery);