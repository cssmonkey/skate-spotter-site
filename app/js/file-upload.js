function fmtbytes(fileSizeInBytes) {
  //Format bytes as size
  var i = -1;
  var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
  do {
      fileSizeInBytes = fileSizeInBytes / 1024;
      i++;
  } while (fileSizeInBytes > 1024);

  return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};



// Revealing module pattern (https://learn.jquery.com/code-organization/concepts/)

window.APP = (function (module, $) {

  'use strict';

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
  var fcnt=0; //number of files to upload 
  var ucnt=0; //upload counter
  var shouldDisplayDataCapture = false;

  var uploadComponent = (function() {

    function init() {
      // bind events...
      $dropzone.on({
        "dragover": fileDragHover,
        "dragleave": fileDragHover,
        "drop": filesDragged
      });

      window.addEventListener("dragover",function(e){e = e || event; e.preventDefault();},false);
      window.addEventListener("drop",function(e){ e = e || event;  e.preventDefault();},false);
    
      $uploadBtn.on('click', function(e) {
        e.preventDefault();

        $fileuploadsInput.click();
      });

      $fileuploadsInput.on('change', filesDragged);

      $addMoreBtn.on('click', function(e) {
        e.preventDefault();

        $fileuploadsInput.click();
      });

      $clearFilesBtn.on('click', function(e) {
        e.preventDefault();
        clearFiles();
      });

      $dataCaptureSkipBtn.on('click', function(e) {
        e.preventDefault();
        displayFilesToUpload();
        shouldDisplayDataCapture = true;
      });

      $dataCaptureBtn.on('click', function(e) {
        e.preventDefault();
        displayFilesToUpload();
        shouldDisplayDataCapture = true;
      });
    }

    function updateUploadIndicatorText() {
      var $indicatorText = $('.upload-indicator', $uploadComponent);
      var filePluralized = filestoUpload.length === 1 ? ' file ' : ' files ';
      
      var text = filestoUpload.length + filePluralized + ' to upload';

      $indicatorText.text(text.trim());
    }

    function fileDragHover(e) {
      e.stopPropagation();
      e.preventDefault();
      
      //Highlight drag and drop box when file dragged to it
      e.type == "dragover" ? $dropzone.addClass('hover') : $dropzone.removeClass('hover');
    };

    function filesDragged(e) {
      e.stopPropagation();
      e.preventDefault();

      var maxfiles=10;
      var maxsize=26214400; //25MB
      var filetypes=["image/jpeg","image/png"];

      // fetch FileList object
      var files = e.target.files || e.dataTransfer && e.dataTransfer.files || e.originalEvent.dataTransfer.files;

      if ( (files.length + filestoUpload.length) > maxfiles) { 
        alert("Maximum number of files allowed to upload (" + maxfiles + ") is exceeded.\nFiles not uploaded please reduce the number of files\noe make multiple submissions.");
        return;
      }	

      //Store files
      var newFiles=[]; //temporary array to hold newly added files 
      
      for (var idx=0; idx < files.length; ++idx) {
        if ($.inArray(files[idx].type, filetypes) > -1) {
          if (files[idx].size <= maxsize) {
              filestoUpload.push(files[idx]); //main array
              newFiles.push(files[idx]); //temporary
          }
          else {
            alert("File " + files[idx].name + " exceeds maximum file size of " + fmtbytes(maxsize) + " !"); 
          }
        }
        else {
          alert("File " + files[idx].name + " is not an accepted image format !"); 
        }                        
      }
      
      uploadFiles.init(newFiles);

      if(shouldDisplayDataCapture) {
        displayFilesToUpload()
      } 
      else {
        displayDataCapture()
      }
    };

    function removeAllMapLayers() {

    }

    function displayDataCapture() {
      $uploadComponent.addClass('is-active show-data-capture');
      module.loader.start('Processing images', true);
      updateUploadIndicatorText();
    }

    function displayFilesToUpload() {
      $uploadComponent
        .removeClass('show-data-capture')
        .addClass('show-files-to-upload');
    }

    function clearFiles() {
      //Remove all files
      //Reset Counter
      fcnt=0;
      //Clear FILES element
      $fileuploadsInput.val("");
      //Clear List
      filestoUpload = [];
      //REMOVE MAP LAYERS
      //removeAllMapLayers();
      //Clear HTML
      $('.upload-component-filelist', $uploadComponent).html('');

      shouldDisplayDataCapture = false;

      $uploadComponent.removeClass('is-active show-data-capture show-files-to-upload');
    }

    return {
      init: init
    }
    
  }());

  var uploadFiles = (function() {

    function init(files) {
      for (var idx = 0; idx < files.length; ++idx) {
        var file = files[idx];

        if (file) {
          var itemHtml = formatImgEntry(file, idx);
          filesizes[fcnt]= file.size; //store for upload progress monitoring

          //ADD HTML TO THE PAGE in Specfied element
          $('.upload-component-filelist', $uploadComponent).prepend(itemHtml);

          //Update the thumbnail from the local file
          displayFile(file,"img_" + idx);
        }
      }
    }

    function formatImgEntry(file, index) {
      var imgThumbnail = '<img id="img_' + index +'" src="" class="upload-item-thumbnail" title="' + file.name + '">';

      var details= '\
        <div class="upload-item-details"> \
          <div class="form-field"> \
            <label for="Img_"' + index + '"_date">Date <span class="mandatory">*</span></label> \
            <input type="text" id="Img_"' + index + '"_date" class="datepicker"> \
            <input type="hidden" id="Img_"' + index + '"_dateF" > \
          </div> \
          <div class="form-field"> \
            <label for="Img_"' + index + '"_time">Time <span class="optional">*</span></label> \
            <input type="time" id="Img_"' + index + '"_time" class="datepicker"> \
          </div> \
        </div> \
      ';

      return '<div class="upload-item">' + imgThumbnail + details + '</div>';
    }

    function displayFile(file, imgId) {
      //Function to initiate filereading into an img element
      var img = document.getElementById(imgId);
      var fReader= new FileReader();
      
      fReader.onloadend = (function(img) {
        return function(){
          img.src = this.result;
        };
      })(img);  
        
      fReader.readAsDataURL(file);
    }

    return {
      init: init
    }

  }());

  // Setup the JS modules on DOM ready
  $( document ).ready(function() {
    $uploadComponent = $(".upload-component");
    $dropzone = $(".upload-component-dropzone", $uploadComponent);
    $fileuploadsInput = $("#fileuploads", $uploadComponent);
    $uploadBtn = $(".upload-btn", $uploadComponent);
    $addMoreBtn = $(".upload-add-more-btn", $uploadComponent);
    $clearFilesBtn = $(".upload-add-clearfiles-btn", $uploadComponent);
    $dataCaptureBtn = $('#data-capture-submit', $uploadComponent);
    $dataCaptureSkipBtn = $('#data-capture-skip', $uploadComponent);

    uploadComponent.init();
    module.loader.init($('.upload-component-process-stage-inner', $uploadComponent));
  });

  return module;

})(window.APP || {}, window.jQuery);