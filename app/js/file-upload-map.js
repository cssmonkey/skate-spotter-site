var clickEvent = (function() {
    if ('ontouchstart' in document.documentElement === true)
      return 'touchstart';
    else
      return 'click';
  })();
// Revealing module pattern (https://learn.jquery.com/code-organization/concepts/)

window.APP = (function(module, $) {
    "use strict";
  
    var fileUploadMap = (function() {
      var $map;
      var isOpen = false;
      var mapLayers = [];
      var crs = "EPSG:3857";
      var olmap;
      var selLayer;
  
      // Point Layer for Image locations
      // Style for points
      var pntstyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 5,
          fill: new ol.style.Fill({ color: "#FF0000" }),
          stroke: new ol.style.Stroke({ color: "#bada55", width: 0.5 })
        })
      });
      var pntstyle2 = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 5,
          fill: new ol.style.Fill({ color: "#FF00FF" }),
          stroke: new ol.style.Stroke({ color: "#bada55", width: 0.5 })
        })
      });
  
      function init() {
        var mapOverlay =
          '\
              <div class="map-overlay"> \
                  <div class="map-panel"> \
                      <h4 class="map-overlay-title">Double click to set location</h4> \
                      <button type="button" class="map-overlay-close-btn"><i class="far fa-times-circle"></i> <span>Close</span></button> \
                      <div class="map"><div id="mapbox"><div id="mapbox-inner"></div></div></div> \
                  </div> \
              </div>';
        $("body").append(mapOverlay);
        $map = $(".map-overlay");
  
        $map.on("click", ".map-overlay-close-btn", function(e) {
          e.preventDefault();
          hide();
        });
  
        // Background Map
        var OSMlayer = new ol.layer.Tile({
          name: "OSM",
          visible: true,
          preload: 0,
          source: new ol.source.OSM()
        });
        mapLayers.push(OSMlayer);
  
        // The MAP
        olmap = new ol.Map({
          target: "mapbox-inner",
          layers: mapLayers,
          loadTilesWhileInteracting: true,
          view: new ol.View({
            projection: crs,
            center: ol.proj.fromLonLat([-5.5, 56.3], crs),
            zoom: 8
          })
        });
  
        // MAP FEATURES
        // Coordinates display
        var mousePositionControl = new ol.control.MousePosition({
          coordinateFormat: ol.coordinate.createStringXY(4),
          projection: "EPSG:4326",
          undefinedHTML: "&nbsp;"
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
  
        if (isOpen) {
          hide();
        } else {
          show();
        }
      }
  
      function show() {
        $map.addClass("is-active");
        isOpen = true;
      }
      function hide() {
        $map.removeClass("is-active");
        isOpen = false;
      }
      function getMap(latInputId, longInputId, filename, allowClick, titleText) {
        $(".map-overlay-title", $map).text(titleText + " form Image " + filename);
  
        show();
  
        olmap.getLayers().forEach(function(layer) {
          if (layer.get("name") == filename) {
            layer.setVisible(true);
            selLayer = layer;
          }
        });
  
        olmap.on(clickEvent, function(evt) {
          if (!allowClick) return;
          var coords = ol.proj.transform(evt.coordinate, crs, "EPSG:4326");
          setPoint(filename, coords[0], coords[1], latInputId, longInputId);
        });
  
        centreLayer(selLayer);
        olmap.updateSize();
      }
      function setPoint(filename, x, y, latInputId, longInputId) {
        var features = [];
        var imgCoords;
  
        // Get the right layer
        olmap.getLayers().forEach(function(layer) {
          if (layer.get("name") == filename) {
            selLayer = layer;
          }
        });
  
        //Create feature
        if (x && y) {
          features.push(addFeature(filename, x, y));
        }
  
        imgCoords = new ol.source.Vector({ features: features });
  
        //Overwrite existing source
        selLayer.setSource(imgCoords);
  
        if (latInputId && longInputId) {
          //Update element
          document.getElementById(latInputId).value = x.toFixed(5);
          document.getElementById(longInputId).value = y.toFixed(5);
        }
      }
      function addLayer(filename, x, y) {
        var useStyle2 = filename.match("/gps$/"); //IE11 compatibility
        //Add NEW LAYER ( with optional point)
        var features = [];
        //Add mew layet
        if (x && y) {
          features.push(addFeature(filename, x, y));
        }
  
        //3b. Vector Source for points
        var imgCoords = new ol.source.Vector({ features: features }); //EMPTY to start with
  
        //3c. Layer for points
        var imgLocations = new ol.layer.Vector({
          name: filename,
          visible: false,
          projection: crs,
          source: imgCoords,
          style: useStyle2 ? pntstyle : pntstyle2
        });
  
        mapLayers[filename] = imgLocations;
        olmap.addLayer(mapLayers[filename]);
      }
      function addFeature(filename, x, y) {
        //Create a feature with the specified coords - add filename as an atribute
        return new ol.Feature({
          geometry: new ol.geom.Point(ol.proj.fromLonLat([x, y], crs)),
          filename: filename
        });
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
      function doEXIF(file, id) {
        //Get EXIF data - need to define callback so file gets loaded before it can read the data
        EXIF.getData(file, function() {
          if (file.exifdata["ExifVersion"]) {
            //DATE
            if (file.exifdata["DateTimeOriginal"]) {
              file.exifdate = file.exifdata["DateTimeOriginal"];
            } else {
              file.exifdate = file.exifdata["DateTime"];
            }
            //DIMENSIONS
            file.exifdims = {
              X: file.exifdata["PixelXDimension"],
              Y: file.exifdata["PixelYDimension"]
            };
            //Autofill DAte & Time on user form
            var dt = file.exifdate;
            $("#Img_" + id + "_date").datepicker(
              "setDate",
              new Date(
                parseInt(dt.substr(0, 4)),
                parseInt(dt.substr(5, 2)) - 1,
                parseInt(dt.substr(8, 2))
              )
            );
  
            //document.getElementById("Img_"+id+"_date").value=file.exifdate.substr(0,10).replace(":","-").replace(":","-");
            $("#Img_" + id + "_time").val(file.exifdate.substr(11, 5));
  
            //GPS
            if (
              file.exifdata["GPSLatitude"] &&
              file.exifdata["GPSLongitude"] &&
              file.exifdata["GPSLatitudeRef"] &&
              file.exifdata["GPSLongitudeRef"]
            ) {
              file.exifgps = readEXIFgps(file.exifdata);
              
              $("#Img_" + id + "_xgps").val(file.exifgps["lng"].toFixed(5));
              $("#Img_" + id + "_ygps").val(file.exifgps["lat"].toFixed(5));
              $("#Img_" + id + "_location").val("gps").change();
          
              addLayer(
                file.name + "_gps",
                file.exifgps["lng"],
                file.exifgps["lat"]
              );
              addLayer(
                file.name + "_map",
                file.exifgps["lng"],
                file.exifgps["lat"]
              );
            } else {
              addLayer(file.name + "_gps");
              addLayer(file.name + "_map");
            }
          } else {
            addLayer(file.name + "_gps");
            addLayer(file.name + "_map");
          }
        });
      }
      function removeLayers() {
        //Remove all but the base layer
        olmap.getLayers().forEach(function (layer) {
          var layerName = layer.get('name');
          if (layerName != "OSM") {
            olmap.removeLayer(layer);
          };
        });
      }
      return {
        init: init,
        toggle: toggle,
        getMap: getMap,
        doEXIF: doEXIF,
        removeLayers: removeLayers
      };
    })();
  
    module.fileUploadMap = fileUploadMap;
  
    return module;
  })(window.APP || {}, window.jQuery);