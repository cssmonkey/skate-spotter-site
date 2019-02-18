// Revealing module pattern (https://learn.jquery.com/code-organization/concepts/)

window.APP = (function (module, $) {
    "use strict";
  
    var map = (function() {
        var $map;
        var isOpen = false;

        function init() {
            var mapOverlay = '\
            <div class="map-overlay"> \
                <div class="map-panel"> \
                    <h4 class="map-overlay-title">Double click to set location</h4> \
                    <button type="button" class="map-overlay-close-btn"><i class="far fa-times-circle"></i> <span>Close</span></button> \
                    <div class="map"></div> \
                </div> \
            </div>';
            $('body').append(mapOverlay);
            $map = $('.map-overlay');

        }
        
        function toggle(e) {
            e.preventDefault();

            if(isOpen) {
                hide();
            }
            else {
                show();
            } 
        }

        function show() {
            $map.fadeIn(function() {
                $(this).addClass('is-active');
                isOpen = true;
            });
        }
        function hide() {
            $map.fadeIn(function() {
                $(this).removeClass('is-active');
                isOpen = false;
            });
        }

        return {
            init: init,
            toggle: toggle
        }
      
    }());
    
    module.map = map;
  
    return module;
      
  
  })(window.APP || {}, window.jQuery);