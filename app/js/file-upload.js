function fmtbytes(fileSizeInBytes) {
  //Format bytes as size
  var i = -1;
  var byteUnits = [" kB", " MB", " GB", " TB", "PB", "EB", "ZB", "YB"];
  do {
    fileSizeInBytes = fileSizeInBytes / 1024;
    i++;
  } while (fileSizeInBytes > 1024);

  return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
}

// Revealing module pattern (https://learn.jquery.com/code-organization/concepts/)

window.APP = (function(module, $) {
  "use strict";

  var $uploadComponent;
  var $dropzone;
  var $fileuploadsInput;
  var $uploadBtn;
  var $addMoreBtn;
  var $dataCaptureBtn;
  var $dataCaptureSkipBtn;
  var $clearFilesBtn;
  var filestoUpload = []; //Stores the files to upload
  var filesizes = [];
  var shouldDisplayDataCapture = false;

  var uploadComponent = (function() {
    function init() {
      // bind events...
      $dropzone.on({
        dragover: fileDragHover,
        dragleave: fileDragHover,
        drop: filesDragged
      });

      window.addEventListener(
        "dragover",
        function(e) {
          e = e || event;
          e.preventDefault();
        },
        false
      );
      window.addEventListener(
        "drop",
        function(e) {
          e = e || event;
          e.preventDefault();
        },
        false
      );

      $uploadBtn.on("click", function(e) {
        e.preventDefault();

        $fileuploadsInput.click();
      });

      $fileuploadsInput.on("change", filesDragged);

      $addMoreBtn.on("click", function(e) {
        e.preventDefault();

        $fileuploadsInput.click();
      });

      $clearFilesBtn.on("click", function(e) {
        e.preventDefault();
        clearFiles();
      });

      $dataCaptureSkipBtn.on("click", function(e) {
        e.preventDefault();
        displayFilesToUpload();
        shouldDisplayDataCapture = true;
      });

      $dataCaptureBtn.on("click", function(e) {
        e.preventDefault();
        displayFilesToUpload();
        shouldDisplayDataCapture = true;
      });

      $uploadComponent.on("click", ".map-trigger", function(e) {
        e.preventDefault();
        var latId = $(this).data("lat"),
          longId = $(this).data("long"),
          filename = $(this).data("file"),
          allowClick = $(this).data("allowclick") * 1,
          title = $(this).data("title");

        module.map.getMap(latId, longId, filename, allowClick, title);
      });
    }

    function conditionalFields() {
      var $select = $(".conditional-select");

      $select.on("change", function() {
        var fieldGroupId = $(this).data("fieldsid");
        var $fieldGroupContainer = $(
          '.conditional-form-groups[data-fieldsid="' + fieldGroupId + '"]'
        );
        var selected = $(this).find("option:selected");
        var $fieldsToShow = $("#" + selected.data("fields"));

        $(
          ".conditional-form-group.is-active",
          $fieldGroupContainer
        ).removeClass("is-active");
        $fieldsToShow.addClass("is-active");
      });
    }

    function updateUploadIndicatorText() {
      var $text = $(".js-photo-text", $uploadComponent);
      var $countText = $(".js-photo-count");
      var filePluralized =
        filestoUpload.length === 1 ? "photograph" : "photographs";

      $countText.text(filestoUpload.length);
      $text.text(filePluralized);
    }

    function fileDragHover(e) {
      e.stopPropagation();
      e.preventDefault();

      //Highlight drag and drop box when file dragged to it
      e.type == "dragover"
        ? $dropzone.addClass("hover")
        : $dropzone.removeClass("hover");
    }

    function filesDragged(e) {
      e.stopPropagation();
      e.preventDefault();

      var maxfiles = 10;
      var maxsize = 26214400; //25MB
      var filetypes = ["image/jpeg", "image/png"];

      // fetch FileList object
      var files =
        e.target.files ||
        (e.dataTransfer && e.dataTransfer.files) ||
        e.originalEvent.dataTransfer.files;

      if (files.length + filestoUpload.length > maxfiles) {
        alert(
          "Maximum number of files allowed to upload (" +
            maxfiles +
            ") is exceeded.\nFiles not uploaded please reduce the number of files\noe make multiple submissions."
        );
        return;
      }

      //Store files
      var newFiles = []; //temporary array to hold newly added files

      for (var idx = 0; idx < files.length; ++idx) {
        if ($.inArray(files[idx].type, filetypes) > -1) {
          if (files[idx].size <= maxsize) {
            filestoUpload.push(files[idx]); //main array
            newFiles.push(files[idx]); //temporary
          } else {
            alert(
              "File " +
                files[idx].name +
                " exceeds maximum file size of " +
                fmtbytes(maxsize) +
                " !"
            );
          }
        } else {
          alert(
            "File " + files[idx].name + " is not an accepted image format !"
          );
        }
      }

      renderFilesForUpload.init(newFiles);
      conditionalFields();

      $("body").addClass("show-upload-modal");

      if (shouldDisplayDataCapture) {
        displayFilesToUpload();
      } else {
        displayDataCapture();
      }
    }

    function removeAllMapLayers() {}

    function displayDataCapture() {
      $uploadComponent.addClass("is-active show-data-capture");
      module.loader.start("Processing images", true);
      updateUploadIndicatorText();
    }

    function displayFilesToUpload() {
      $uploadComponent
        .removeClass("show-data-capture")
        .addClass("show-files-to-upload");
      module.loader.start("Loading", true, 750);
      updateUploadIndicatorText();
    }

    function clearFiles() {
      //Clear FILES element
      $fileuploadsInput.val("");
      //Clear List
      filestoUpload = [];
      //REMOVE MAP LAYERS
      //removeAllMapLayers();
      //Clear HTML
      $(".upload-component-filelist-inner", $uploadComponent).html("");

      shouldDisplayDataCapture = false;

      $uploadComponent.removeClass(
        "is-active show-data-capture show-files-to-upload"
      );
      $("body").removeClass("show-upload-modal");
    }

    return {
      init: init
    };
  })();

  var renderFilesForUpload = (function() {
    function init(files) {
      for (var idx = 0; idx < files.length; ++idx) {
        var file = files[idx];

        if (file) {
          var itemHtml = formatImgEntry(file, idx);
          filesizes[idx] = file.size; //store for upload progress monitoring

          //ADD HTML TO THE PAGE in Specfied element
          $(".upload-component-filelist-inner", $uploadComponent).prepend(
            itemHtml
          );

          //Update the thumbnail from the local file
          displayFile(file, "img_" + idx);

          // Setup DatePicker
          module.datePicker.init(
            "#Img_" + idx + "_date",
            "#Img_" + idx + "_dateF"
          );

          // GET EXIF data
          module.map.doEXIF(file, idx);

          //Add an event to show exif data on double click
          $("#img_" + idx).on("dblclick", function(e) {
            e.preventDefault(e);
            EXIF.getData(file, function() {
              alert(EXIF.pretty(file));
            });
          });

          handleLocationEntry();
        }
      }
    }

    function handleLocationEntry() {}

    function formatImgEntry(file, index) {
      var imgThumbnail =
        '<div class="upload-item-thumbnail-container"><img id="img_' +
        index +
        '" src="" class="upload-item-thumbnail" title="' +
        file.name +
        '"></div>';

      var details =
        '\
        <div class="form-fields upload-item-details"> \
          <div class="form-row"> \
            <div class="form-group col-md-6"> \
              <label for="Img_' +
        index +
        '_date">Date</label> \
              <div class="datepicker-field-container"><input type="text" id="Img_' +
        index +
        '_date" class="form-control datepicker-field"></div> \
              <input type="hidden" id="Img_' +
        index +
        '_dateF" > \
            </div> \
            <div class="form-group col-md-6"> \
              <label for="Img_' +
        index +
        '_time">Time <span class="optional">(optional)</span></label> \
              <input type="time" id="Img_' +
        index +
        '_time" class="form-control form-control-short"> \
            </div> \
          </div> \
          <div class="form-row"> \
            <div class="col-md-12"><label for="Img_' +
        index +
        '_area">Describe where the photo was taken</label></div> \
            <div class="form-group col-md-6"> \
              <select id="Img_' +
        index +
        '_area" class="custom-select"> \
                <option value="none">Select General Area</option> \
                <option value="Firth of Lorn - Insh">Firth of Lorn – Insh</option> \
                <option value="Firth of Lorn - Kerrera">Firth of Lorn – Kerrera</option> \
                <option value="Firth of Lorn - Mull shore">Firth of Lorn – Mull shore</option> \
                <option value="Firth of Lorn - Morven shore">Firth of Lorn – Morven shore</option> \
                <option value="Sound of Mull North">Sound of Mull North</option> \
                <option value="Sound of Mull South">Sound of Mull South</option> \
                <option value="Sound of Jura North">Sound of Jura North</option> \
                <option value="Sound of Jura South">Sound of Jura South</option> \
                <option value="Other">Other (Specify Below)</option> \
              </select> \
            </div> \
            <div class="form-group col-md-6"> \
              <select id="Img_' +
        index +
        '_location" class="custom-select conditional-select" data-fieldsid="' +
        index +
        '"> \
                <option value="none">Select Coordinate Entry</option> \
                <option value="coords" data-fields="location_' +
        index +
        '_coords">Enter Coordinates or Click on Map</option> \
                <option value="gps" data-fields="location_' +
        index +
        '_gps">Coordinates from Image EXIF</option> \
                <option value="description" data-fields="location_' +
        index +
        '_description">Other location</option> \
              </select> \
            </div> \
          </div> \
          <div class="form-row"> \
            <div class="conditional-form-groups" data-fieldsid="' +
        index +
        '"> \
              <div class="conditional-form-group" id="location_' +
        index +
        '_coords"> \
                <div class="form-row"> \
                  <div class="col-md-4"> \
                    <label for="Img_' +
        index +
        '_x">Lat</label> \
                    <input type="text" id="Img_' +
        index +
        '_x" class="form-control"> \
                  </div> \
                  <div class="col-md-4"> \
                    <label for="Img_' +
        index +
        '_y">Long</label> \
                    <input type="text" id="Img_' +
        index +
        '_y" class="form-control"> \
                  </div> \
                  <div class="col-md-4 map-trigger-container"> \
                    <button class="map-trigger" type="button" id="Img_' +
        index +
        '_coord-map-btn" \
                      data-lat="Img_' +
        index +
        '_x" data-long="Img_' +
        index +
        '_y" data-file="' +
        file.name +
        '_map" data-allowclick="-1" data-title="Double click to set location"> \
                      <i class="fas fa-map-marker-alt"></i> Find on map\
                    </button> \
                  </div> \
                </div> \
              </div> \
              <div class="conditional-form-group" id="location_' +
        index +
        '_gps"> \
                <div class="form-row"> \
                  <div class="col-md-4"> \
                    <label for="Img_' +
        index +
        '_xgps">Lat</label> \
                    <input type="text" id="Img_' +
        index +
        '_xgps" class="form-control"> \
                  </div> \
                  <div class="col-md-4"> \
                    <label for="Img_' +
        index +
        '_ygps">Long</label> \
                    <input type="text" id="Img_' +
        index +
        '_ygps" class="form-control"> \
                  </div> \
                  <div class="col-md-4 map-trigger-container"> \
                    <button class="map-trigger" type="button" id="Img_' +
        index +
        '_coord-map-btn" \
                      data-lat="Img_' +
        index +
        '_xgps" data-long="Img_' +
        index +
        '_ygps" data-file="' +
        file.name +
        '_gps" data-allowclick="0" data-title="GPS location"> \
                      <i class="fas fa-map-marker-alt"></i> Find on map\
                    </button> \
                  </div> \
                </div> \
              </div> \
              <div class="conditional-form-group" id="location_' +
        index +
        '_description"> \
                <label for="Img_' +
        index +
        '_desc">Description of location <span class="optional">(optional)</span></label> \
                <input type="text" id="Img_' +
        index +
        '_desc" class="form-control" /> \
              </div> \
            </div> \
          </div> \
          <div class="form-row"> \
            <div class="form-group col-md-6"> \
              <label for="Img_' +
        index +
        '_angling">Platform <span class="optional">(optional)</span></label> \
              <select id="Img_' +
        index +
        '_angling" class="custom-select"> \
                <option value="none">Select</option> \
                <option value="charter">Charter boat</option> \
                <option value="private">Private boat</option> \
                <option value="other">Other boat</option> \
                <option value="shore">Shore</option> \
              </select> \
            </div> \
            <div class="form-group col-md-6"> \
              <label for="Img_' +
        index +
        '_angling">Gender <span class="optional">(optional)</span></label> \
              <select id="Img_' +
        index +
        '_gender" class="custom-select"> \
                <option value="N"></option> \
                <option value="M">Male</option> \
                <option value="F">Female</option> \
                <option value="U">Don\'t know</option> \
              </select> \
            </div> \
          </div> \
          <div class="form-row"> \
            <div class="form-group col-md-6"> \
              <label for="Img_' +
        index +
        '_length">Length of fish in cm <span class="optional">(optional)</span></label> \
              <input type="text" id="Img_' +
        index +
        '_length" class="form-control"> \
            </div> \
            <div class="form-group col-md-6"> \
              <label for="Img_' +
        index +
        '_width">Width of fish in cm <span class="optional">(optional)</span></label> \
              <input type="text" id="Img_' +
        index +
        '_width" class="form-control"> \
            </div> \
          </div> \
          <div class="form-row"> \
            <div class="form-group col-md-6"> \
              <label for="Img_' +
        index +
        '_weight">Estimated weight in lbs <span class="optional">(optional)</span></label> \
              <input type="text" id="Img_' +
        index +
        '_weight" class="form-control"> \
            </div> \
            <div class="form-group col-md-6" title="If the images are of diffrent skates please indicate which skate the image is of."> \
              <label for="Img_' +
        index +
        '_skate">ID <span class="optional">(optional)</span></label> \
              <input type="number" id="Img_' +
        index +
        '_skate" min="1" max="5" class="form-control"> \
            </div> \
          </div> \
          <div class="form-row"> \
            <div class="form-group col-md-6"> \
              <label for="Img_' +
        index +
        '_tag">List any Tag numbers found <span class="optional">(optional)</span></label> \
              <input type="text" id="Img_' +
        index +
        '_tag" class="form-control"> \
            </div> \
          </div> \
          <div class="form-row"> \
            <div class="form-group col-md-12"> \
              <label for="Img_' +
        index +
        '_details">Any further details e.g. scars <span class="optional">(optional)</span></label> \
              <textarea id="Img_' +
        index +
        '_details" class="form-control"></textarea> \
            </div> \
          </div> \
        </div> \
      ';

      return '<div class="upload-item">' + imgThumbnail + details + "</div>";
    }

    function displayFile(file, imgId) {
      //Function to initiate filereading into an img element
      var img = document.getElementById(imgId);
      var fReader = new FileReader();

      fReader.onloadend = (function(img) {
        return function() {
          img.src = this.result;
        };
      })(img);

      fReader.readAsDataURL(file);
    }

    return {
      init: init
    };
  })();

  // Setup the JS modules on DOM ready
  $(document).ready(function() {
    $uploadComponent = $(".upload-component");
    $dropzone = $(".upload-component-dropzone", $uploadComponent);
    $fileuploadsInput = $("#fileuploads", $uploadComponent);
    $uploadBtn = $(".upload-btn", $uploadComponent);
    $addMoreBtn = $(".upload-add-more-btn", $uploadComponent);
    $clearFilesBtn = $(".upload-add-clearfiles-btn", $uploadComponent);
    $dataCaptureBtn = $("#data-capture-submit", $uploadComponent);
    $dataCaptureSkipBtn = $("#data-capture-skip", $uploadComponent);

    module.map.init();
    uploadComponent.init();

    module.loader.init(
      $(".upload-component-process-stage-inner", $uploadComponent)
    );
  });

  return module;
})(window.APP || {}, window.jQuery);
