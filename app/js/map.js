// Revealing module pattern (https://learn.jquery.com/code-organization/concepts/)

window.APP = (function (module, $) {
    "use strict";
  
    var map = (function() {
        var $map;
        var isOpen = false;
        var mapLayers=[];
        var crs="EPSG:3857";
        var olmap;

        function init() {
            var mapOverlay = '\
            <div class="map-overlay"> \
                <div class="map-panel"> \
                    <h4 class="map-overlay-title">Double click to set location</h4> \
                    <button type="button" class="map-overlay-close-btn"><i class="far fa-times-circle"></i> <span>Close</span></button> \
                    <div class="map"><div id="mapbox"></div></div> \
                </div> \
            </div>';
            $('body').append(mapOverlay);
            $map = $('.map-overlay');

            $map.on('click', '.map-overlay-close-btn', function(e) {
                e.preventDefault();
                hide();
            });

            // Background Map
            var OSMlayer = new ol.layer.Tile({
                name: "OSM",
                visible: true, 
                preload: 0, 
                source: new ol.source.OSM()
            })
            mapLayers.push(OSMlayer);

            // Point Layer for Image locations
            // Style for points
            var pntstyle = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    fill: new ol.style.Fill({color: '#FF0000'}),
                    stroke: new ol.style.Stroke({color: '#bada55', width: 0.5 })
                })
            });                 
            var pntstyle2 = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 5,
                    fill: new ol.style.Fill({color: '#FF00FF'}),
                    stroke: new ol.style.Stroke({color: '#bada55', width: 0.5 })
                })
            });    

            // The MAP
            olmap = new ol.Map({
                target: 'mapbox',
                layers: mapLayers,
                loadTilesWhileInteracting: true,
                view: new ol.View({
                    projection: crs,           	
                    center: ol.proj.fromLonLat([-5.5,56.3],crs),   
                    zoom: 8
                })
            });

            // MAP FEATURES
            // Coordinates display        	
            var mousePositionControl = new ol.control.MousePosition({
                coordinateFormat: ol.coordinate.createStringXY(4), 
                projection: 'EPSG:4326', 
                undefinedHTML: '&nbsp;'
            });
            olmap.addControl(mousePositionControl);
            // disable Double Click ZOOM
            var dblClickInteraction;
            olmap
                .getInteractions()
                .getArray()
                .forEach(function(interaction) {
                    if (interaction instanceof ol.interaction.DoubleClickZoom) {
                        dblClickInteraction = interaction;
                    }
                });
            olmap.removeInteraction(dblClickInteraction);

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
            $map.addClass('is-active');
            isOpen = true;  
        }
        function hide() {
            $map.removeClass('is-active');
            isOpen = false;
        }
        function getMap(latInputId, longInputId, filename, allowClick, titleText ) {
            var selLayer;

            $('.map-overlay-title', $map).text(titleText + ' form Image ' + filename);
            
            show();

            olmap.getLayers().forEach(function (layer) {
                if (layer.get('name') == filename ) {
                    layer.setVisible(true);
                    selLayer = layer;
                };
            });

            olmap.on('dblclick', function(evt) {
                if(!allowClick) return;
                var coords = ol.proj.transform(evt.coordinate, crs, "EPSG:4326");
                setPoint(filename, coords[0], coords[1], latInputId, longInputId); 
            });

            centreLayer(selLayer); 
            olmap.updateSize();
        }
        function setPoint() {

        }
        function addLayer() {

        }
        function addFeature() {

        }
        function centreLayer(selLayer) {
            // Centre layer on first feature
            if (selLayer) {            
	            var feature = selLayer.getSource().getFeatures();
                if (feature[0]) {
                    olmap.getView().setCenter(feature[0].getGeometry().getCoordinates());
                }
            }
        }
        return {
            init: init,
            toggle: toggle,
            getMap: getMap
        }
      
    }());
    
    module.map = map;
  
    return module;
      
  
  })(window.APP || {}, window.jQuery);