//For upload file counting
var filestoUpload=[]; //Stores the files to upload
var filedata=[];
var filesizes=[];
var tsize;
var fcnt=0; //number of files to upload 
var ucnt=0; //upload counter
var filedrag; //to hole filelist elementy
var fileuploads;

//Filtering
var maxsize=26214400; //25MB
var maxfiles=10;
var filetypes=["image/jpeg","image/png"];


    function addEvent( obj, type, fn ) {
        if ( obj.attachEvent ) {
            obj['e'+type+fn] = fn;
            obj[type+fn] = function(){obj['e'+type+fn]( window.event );}
            obj.attachEvent( 'on'+type, obj[type+fn] );
        } else
            obj.addEventListener( type, fn, false );
    }

function Init() {
	//CALLED AFTER LOADING Document - set event for file selection & drag dropping
	filedrag=document.getElementById("filelist"); //set teh filelist object as the drag & drop zone
    filedrag.addEventListener("dragover", FileDragHover, false);
	filedrag.addEventListener("dragleave", FileDragHover, false);
	filedrag.addEventListener("drop", filesdragged, false);
	fileuploads=document.getElementById("fileuploads");
	fileuploads.addEventListener("change", filesdragged, false);


	//prevent drag drop anywhere else on window
	window.addEventListener("dragover",function(e){e = e || event; e.preventDefault();},false);
    window.addEventListener("drop",function(e){ e = e || event;  e.preventDefault();},false);
	$("#uploadbtn").addClass("hideit");
	$("#clearbtn").addClass("hideit");
}

function FileDragHover(e) {
    //HIghlight drag and drop box when file dragged to it
	e.stopPropagation();
	e.preventDefault();
	filedrag.className = (e.type == "dragover" ? "hover" : "");
}

function filesdragged(e) {
    //Process files dragged to drop & drag box or selected from file dialog
     FileDragHover(e);
	// fetch FileList object
	var files = e.target.files || e.dataTransfer.files;
	if ( (files.length+filestoUpload.length)>maxfiles)
		{ alert("Maximum number of files allowed to upload ("+maxfiles+") is exceeded.\nFiles not uploaded please reduce the number of files\noe make multiple submissions.");
		  return;}	
	//Store files
	var newfiles=[]; //tempororay array to hold newly added files 
     for (idx=0;idx < files.length; ++idx) {
		if ($.inArray(files[idx].type,filetypes)>-1) {
            if (files[idx].size<=maxsize) {
	           	filestoUpload.push(files[idx]); //main array
            	newfiles.push(files[idx]); //temporary
	            
	            }
			else {
			   alert("File "+files[idx].name+" exceeds maximum file size of "+fmtbytes(maxsize)+" !"); 
               }
            }
         else {
    	     alert("File "+files[idx].name+" is not an accepted image format !"); 
			}                  
               
        } //for
    	 
    //Display the new files
    displayfiles(newfiles);
}

function displayfiles(files) {
  //Process List of files selected & dragged for display
  var ncnt=fcnt; 
  //Create Div & img elements to display each file
  displayfilelistsAsThumbs(filedrag,files);

  //Display Upload button if files selected  
  if (fcnt>0) {
	  $("#uploadbtn").removeClass('hideit');
	  $("#uploadbtn").prop("value","Upload "+fcnt+" files");
	  $("#clearbtn").removeClass('hideit');
	  }
}; //function displayfiles

function displayfilelistsAsThumbs(el,files) {
//Format FileList objects as a set of Divs with IMg elements
 var html="";
 var ncnt=fcnt;
  //Create an HTML element for each file
   for (idx=0;idx < files.length; ++idx)
     {
     var file = files[idx];
  	 if (file) {
        var filesize = fmtbytes(file.size); filesizes[fcnt]= file.size; //store for upload progress monitoring
        //CREATE HTML
        //html= "<div class=\"divthmbselect\" id=\"file"+fcnt+"\"><img id='img"+fcnt+"' src=\"\" class=\"imgthmb\" title=\""+file.name+"\"></div>";
		html= formatImgEntry(file,"img",fcnt,"");
		//ADD HTML TO THE PAGE in Specfied element
        el.insertAdjacentHTML('beforeend',html); //faster than using += on innerHTML !
   		//Update the thumbnail from the local file
		displayFile(file,"img"+fcnt);
		//DAte Picker
		 setDatePickerID(fcnt);
        //Get EXIF data ( asynchronous !)
        doEXIF(file,fcnt);
        //Add an event to show exif data on double click
		document.getElementById("img"+fcnt).ondblclick = function () {
		    EXIF.getData(file, function() { 
		    	alert(EXIF.pretty(file));
		    	});
			}
        fcnt++;
        };
    };//for each file

   
}//function displayfilelistsasThumbs

function displayFile(file,imgid) {
//Function to initiate filereading into an img element
  var img=document.getElementById(imgid);
  var fReader= new FileReader();
  fReader.onloadend = (function(img){
                return function(){
                    img.src = this.result;
                };
            })(img);  
   fReader.readAsDataURL(file);
} //Display File

function clearfiles(){
	//Remove all files
	//Reset Counter
	fcnt=0;
	//Clear FILES element
	document.getElementById('fileuploads').value="";
	//Clear List
    filestoUpload=[];
    filedata=[];
    //REMOVE MAP LAYERS
    removeAllLayers();
    //Clear HTML
    filedrag.innerHTML="";
    //HIDE UPLOAD Buttons
   	$("#uploadbtn").addClass('hideit');
	$("#clearbtn").addClass('hideit');

}

function formatImgEntry(file,imgprfx,id,src) {
var flnm=file.name;
var html="<div class=\"subpanel\">";
   //ID 
   html+= "<div style=\"display: inline-block;font-size: 14px;font-weight:bold;text-align:center;vertical-align:top;min-width: 25px; \">"+(id+1)+"</div>";
   //THUMBNAIL DIV
   html+= "<div class=\"divthmb\" id=\"file"+id+"\"><img id='"+imgprfx+id+"' src=\""+src+"\" class=\"imgthmb\" title=\""+file.name+"\n["+fmtbytes(file.size)+"]"+"\n"+file.type+"\"></div>";
   
   
   //TODO - BUtton to select input from last image
   

   //IMAGE details DIV

   //USER INPUT DIV 1
   html+= "<div class=\"details\" style='width: 170px;'>";
	    html+="<div class=\"elm\" style=\"padding-top: 5px;\"><div style='min-width: 35px;display: inline-block;'>Date<span class=\"enh\">*</span></div>"
          //  html+="<input type=\"date\" id=\"Img_"+id+"_date\"><br>";	   //REPLACED with jquery datepicker
            html+="<input type=\"text\" id=\"Img_"+id+"_date\" style=\"width: 90px;\" class='dtpck'><br>";
            html+="<input type=\"hidden\" id=\"Img_"+id+"_dateF\" >";
            html+="<div style='min-width: 35px;display: inline-block;'>Time</div><input type=\"time\" id=\"Img_"+id+"_time\"><br>";	   //TODO - use with jquery picker
        html+="</div>";
    	 //ANGLING PLATFORM :Img_id_angling
   	     html+="<div class=\"elm\" >Platform: "
  	        html+="<select id=\"Img_"+id+"_angling\" style='width: 105px;'>";
            html+="<option value=\"none\">-Select-</option>";
            html+="<option value=\"charter\">Charter boat</option>";
            html+="<option value=\"private\">Private boat</option>";
            html+="<option value=\"other\">Other boat</option>";
            html+="<option value=\"shore\">Shore</option>";
            html+="</select>";
          html+="</div>";
	     //FISH DIMENSIONS

        html+="<div class=\"elm3 elm2\" style='float:left;max-width: 90px;'>";
            //html+="<input type=\"text\" id=\"Img_"+id+"_port\" style='width: 156px;' placeholder='Enter Boat port..'>";
	        html+="<div title=\"Length of fish in cm\">";
	        html+="<div style='min-width: 44px;display: inline-block;'>Length </div><input type='text' id='Img_"+id+"_length'  style='width:20px;'>cm</div>"
         	html+="<div title=\"Width of fish in cm\">";
	        html+="<div style='min-width: 44px;display: inline-block;'>Width: </div><input type='text' id='Img_"+id+"_width'  style='width:20px;'>cm</div>"
        	html+="<div title=\"Estimated Weight of fish in Pounds\">";
	        html+="<div style='min-width: 44px;display: inline-block;'>Weight: </div><input type='text' id='Img_"+id+"_weight'  style='width:20px;'>lbs</div>"
	    html+="</div>";
        //5. SKATE ID & GENDER
        html+="<div class=\"elm3 elm2\" style='max-width: 77px;float:right;'> ";
            html+="<div title=\"If the images are of diffrent skates please indicate which skate the image is of.\">ID: <input type=\"number\" id=\"Img_"+id+"_skate\"  min=\"1\" max=\"5\" style='width:40px;'></div>"
			html+="<div class=\"elm\" >Gender:<br>"
				html+="<select id=\"Img_"+id+"_gender\" style='width: 60px;'>";
				html+="<option value=\"N\"></option>";
				html+="<option value=\"M\">Male</option>";
				html+="<option value=\"F\">Female</option>";
            	html+="<option value=\"U\">Don't know</option>";
				html+="</select>";
			html+="</div>";
        html+="</div>";

    html+="</div>";
   //USER INPUT DIV 2
   html+= "<div class=\"details\" style='width: 240px;'>";

    //LOCATION: Img_id_location (TYPE)
       //html+="<div style=\"padding-top: 5px;\">Where was photo taken ? <span class=\"enh\">*</span></div>"
       html+="<div class=\"elm\" style='padding-top: 2px;'>Describe where the photo was taken: <span class=\"enh\">*</span> <br>"
    	//3. Area: Img_id_area
    	html+="<div class=\"elm\" id=\"loc_"+id+"_area\" style=\"display: block;padding-top: 2px\">";// Area:<br>";
    	html+="<select id=\"Img_"+id+"_area\"  style='width: 230px;padding: 2px;'>";
    	html+="<option value=\"none\">&lt;-- Select General Area --&gt;</option>";
    	html+="<option value=\"Firth of Lorn - Insh\">Firth of Lorn – Insh</option>";
    	html+="<option value=\"Firth of Lorn - Kerrera\">Firth of Lorn – Kerrera</option>";
    	html+="<option value=\"Firth of Lorn - Mull shore\">Firth of Lorn – Mull shore</option>";
    	html+="<option value=\"Firth of Lorn - Morven shore\">Firth of Lorn – Morven shore</option>";
    	html+="<option value=\"Sound of Mull North\">Sound of Mull North</option>";
    	html+="<option value=\"Sound of Mull South\">Sound of Mull South</option>";
    	html+="<option value=\"Sound of Jura North\">Sound of Jura North</option>";
    	html+="<option value=\"Sound of Jura South\">Sound of Jura South</option>";
        html+="<option value=\"Other\">Other (Specify Below)</option>";
    	html+="</select><br>";
    	html+="</div>";


            html+="<div class=\"elm\" style='padding-top: 1px;'>";
  	 		html+="<select id=\"Img_"+id+"_location\" onChange=\"getLocation(this,"+id+")\" style='width: 230px;'>";
     		html+="<option value=\"none\">&lt;-- Select Coordinate Entry --&gt;</option>";
     		html+="<option value=\"coords\">Enter Coordinates or Click on Map</option>";
     		html+="<option value=\"gps\">Coordinates from Image EXIF</option>";
     		//html+="<option value=\"area\">Select Area</option>";
     		html+="<option value=\"description\">Other location</option>";
            html+="</select>";
       html+="</div>";

	    html+="<div class=\"elm\" id='loc_"+id+"_none' style=\"display: block;height: 21px;\">";//Description: <br>";
    	html+="&nbsp";
    	html+="</div>"


    //1. Lat Long:  Img_id_x & Img_id_y
       html+="<div class=\"elm\" id=\"loc_"+id+"_coords\" style=\"display: none;padding-top: 2px;\">"
		    html+="<div style='display: inline-block;width: 25px;'>Lat:</div>";
    		html+="<input type=\"text\" style='width: 50px;padding: 1px;' id=\"Img_"+id+"_x\" >";
    		html+="<div style=\"display: inline-block;width: 35px;\">&nbsp;&nbsp;Long: </div>";
    		html+="<input type=\"text\" style='width: 50px;padding: 1px;' id=\"Img_"+id+"_y\" >";
    		html+="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a  href='javascript:void(0)'  onclick=\"getMap('Img_"+id+"_x','Img_"+id+"_y','"+flnm+"_map',-1,'Double Click to set location')\">Map</a>";
       html+="</div>";
	   //2. Lat Long from gps
       html+="<div class=\"elm\" id=\"loc_"+id+"_gps\" style=\"display: none;padding-top: 2px;\">"
                html+="<div style='display: inline-block;width: 25px;'>Lat:</div>";
                html+="<input type=\"text\" style='width: 50px;padding: 1px;' id=\"Img_"+id+"_xgps\" disabled>";
                html+="<div style=\"display: inline-block;width: 35px;\">&nbsp;&nbsp;Long: </div>";
                html+="<input type=\"text\" style='width: 50px;padding: 1px;' id=\"Img_"+id+"_ygps\" disabled>";
                html+="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a  href='javascript:void(0)'  onclick=\"getMap('Img_"+id+"_xgps','Img_"+id+"_ygps','"+flnm+"_gps',0,'GPS Location')\">Map</a>";
      html+="</div>";

	  //4. Describe : Img_id_desc
       html+="<div class=\"elm\" id=\"loc_"+id+"_description\" style=\"display: none;padding-top: 2px;\">";//Description: <br>";
            html+="<input type='text' size=\"25\" id=\"Img_"+id+"_desc\" style='width:230px;padding: 1px;' placeholder='Enter description here'>";
       html+="</div>"
       //other details
    html+="<div class=\"elm\" style='padding-top: 2px'>Tags : ";
    html+="<input type=\"text\" id=\"Img_"+id+"_tag\" style='width: 175px;padding: 1px;' placeholder='List any Tag numbers found'></div>";
    html+="<div class=\"elm\">Any further details ( e.g. scars):<br>";
    html+="<textarea id=\"Img_"+id+"_details\" style='width: 230px;height: 30px;'></textarea></div>";

    html+="</div>";

   html+="</form>";
//THE END   
html+="</div>";
return html;
}//function formatImgEntry

function doEXIF(file,id) {
//Get EXIF data - need to define callback so file gets loaded before it can read the data
EXIF.getData(file, function() {
       if (file.exifdata['ExifVersion']) {
          //DATE
		  if (file.exifdata["DateTimeOriginal"]) {file.exifdate=file.exifdata["DateTimeOriginal"];} else {file.exifdate=file.exifdata["DateTime"];}
		  //DIMENSIONS
		  file.exifdims={X: file.exifdata["PixelXDimension"], Y:file.exifdata["PixelYDimension"]};
		  //Autofill DAte & Time on user form
          var dt= file.exifdate;
		  $("#Img_"+id+"_date").datepicker("setDate",new Date (parseInt(dt.substr(0,4)),parseInt(dt.substr(5,2))-1,parseInt(dt.substr(8,2))));

		  //document.getElementById("Img_"+id+"_date").value=file.exifdate.substr(0,10).replace(":","-").replace(":","-");
		  document.getElementById("Img_"+id+"_time").value=file.exifdate.substr(11,5);

		  //GPS
		  if (file.exifdata['GPSLatitude'] && file.exifdata['GPSLongitude'] && file.exifdata['GPSLatitudeRef'] && file.exifdata['GPSLongitudeRef']) {
		            file.exifgps=readEXIFgps(file.exifdata);
		            document.getElementById("Img_"+id+"_xgps").value=file.exifgps['lng'].toFixed(5);
		            document.getElementById("Img_"+id+"_ygps").value=file.exifgps['lat'].toFixed(5);
		            document.getElementById("Img_"+id+"_location").value="gps";
		            getLocation(document.getElementById("Img_"+id+"_location"),id);
		            //document.getElementById("loc_"+id+"_gps").style.display="block";
		            addLayer(file.name+"_gps",file.exifgps['lng'],file.exifgps['lat']);
		            addLayer(file.name+"_map",file.exifgps['lng'],file.exifgps['lat']);
		  	  }
		  else
		    {addLayer(file.name+"_gps");addLayer(file.name+"_map");}	  
 		  }
 		else
 		  {addLayer(file.name+"_gps");addLayer(file.name+"_map");}  
       });

}

function uploadProgress(evt) {
//Progress of files upload - 
        if (evt.lengthComputable) {
            var percentComplete = Math.round(evt.loaded * 100 / evt.total);
              if (percentComplete < 100)
                { document.getElementById('prog').innerHTML = percentComplete.toString() + '%';
                  while (evt.loaded >= tsize) {
                      //TODO - PROGRESS BAR DISPLAY of EACH FILE ?
                      $("#file"+ucnt).css({'background-color': '#CCFFCC'});
        		      ucnt++;
             		  tsize += filesizes[ucnt];
			      } 
                }
            else     
                 {
                 document.getElementById('prog').innerHTML = 'Processing...';
                 for (c=0;c<fcnt;c++) 
	                 $("#file"+ucnt).css({'background-color': '#CCFFCC'});
                 }
             }
        else {
          document.getElementById('prog').innerHTML = 'unable to compute';
          }
}; //function uploadprogress

function uploadfiles() {
    //UPLOAD & PROCESS FILES - get user input
	var msg="";
    //1. new Path nam
    var d=new Date();
    var upfldr="upload_"+d.toISOString().substring(0, 19).replace('T', '_').replace(/:/g,"-");
    var submitdt=d.toISOString().substring(0, 19).replace('T', ' ');
    //2. The FORM data
    var fd = new FormData();
    var submitname=document.getElementById("submitter").value;
    var submitemail=document.getElementById("emailaddr").value;
	    //2a. destination path
        fd.append("name",submitname);
        fd.append("email",submitemail);
	    fd.append("pth",upfldr);
        fd.append("submitdt",submitdt);
     var mpa1=document.getElementById("mpaCC").value;
     var mpa2=document.getElementById("mpaF").value;
	    fd.append("mpaCC",mpa1);
    	fd.append("mpaFISH",mpa2);

	    //2b. Dragged & selected files


	var filedata={};
    var x,y,desc;
	for (idx=0;idx<filestoUpload.length;idx++) {
	         var file=filestoUpload[idx];
	         var dt=document.getElementById("Img_"+idx+"_dateF").value;
             var tm=document.getElementById("Img_"+idx+"_time").value;

	         if (dt=="") msg+="\nNo date given for Image "+(idx+1);
	         else dt=dt+" "+tm;
	         var ang=document.getElementById("Img_"+idx+"_angling").value;

	         //var prt=document.getElementById("Img_"+idx+"_port").value;

	         var skate=document.getElementById("Img_"+idx+"_skate").value;
             var tag=document.getElementById("Img_"+idx+"_tag").value;
             var detail=document.getElementById("Img_"+idx+"_details").value;

		     var gender=document.getElementById("Img_"+idx+"_gender").value;
             var width=document.getElementById("Img_"+idx+"_width").value;
		     var length=document.getElementById("Img_"+idx+"_length").value;
             var weight=document.getElementById("Img_"+idx+"_weight").value;

             // NOT FOR NOW var living=document.getElementById("Img_"+idx+"_living").value;
		     var living="Y";

	        //TODO: CHECK then append to file object ? Img_IDX_date, Img_IDX_angling, Img_IDX_port,Img_IDX_Location
	        //Location
            desc=$("#Img_"+idx+"_area").val();
            if (desc=="none") msg+="\nPlease select Area where Image "+(idx+1)+"was taken ";
	         var loc=document.getElementById("Img_"+idx+"_location").value;
              x=null;y=null;
             switch(loc) {
                case "coords": x=document.getElementById("Img_"+idx+"_x").value;y=document.getElementById("Img_"+idx+"_y").value; break;
                case "gps": x=document.getElementById("Img_"+idx+"_xgps").value;y=document.getElementById("Img_"+idx+"_ygps").value; break;
                case "map":x=document.getElementById("Img_"+idx+"_xmap").value;y=document.getElementById("Img_"+idx+"_ymap").value; break;
                //case "area": desc=$("#Img_"+idx+"_area").val(); break;
                case "description": desc+=" : "+document.getElementById("Img_"+idx+"_desc").value; break;
				case "none":desc="No location given"; x="";y=""; msg+="\nNo location given for Image "+(idx+1);
			 }	   	         
	        filedata[file.name.toLowerCase()]={filename: file.name.toLowerCase(),date_taken: dt,
				                                platform: ang,
				                                //port: prt,
				                                skate: skate,gender: gender,
				                                location_type: loc, location_description: desc,longitude: x,latitude: y,
				                                tags_seen: tag,details: detail,living: living,
				                                width: width,length: length,weight: weight};

	        fd.append("imagefiles[]", file);	
	        
	        }
	//Need to define thedata types being passed
	filedata['types']={filename: "s",date_taken: "s", platform: "s",
		       //port: "s",
		       skate: "i",gender: "s",
		       location_type: "s", location_description: "s",longitude: "d",latitude: "d",
		       tags_seen: "s",details: "s",living: "i",
		       width: "i",length: "i",weight: "i"};
    fd.append("filedata",JSON.stringify(filedata));

   // if (submitname=="" || submitemail=="" ) {
   //     msg="Please ensure you enter your name and email !\n"+msg;
   //  }

    if (msg !=""){
        alert(msg);
        return;
	}


    //2c. FINAL CHECK
	     //TODO Check email adress "emailaddr"  if chkbox "nocomms" checked
	//3 Initialize Counter	 
	tsize=filesizes[0]; //for counter  
	//AJAX !!!
	$.ajax({ url: "include/processimagesdb.php", type: "POST",
	         data: fd, datatype: "json",
	         xhr: function() {
                var myXhr = $.ajaxSettings.xhr();
                if(myXhr.upload){
                    myXhr.upload.addEventListener('progress',uploadProgress, false);
                }
                return myXhr;
                },
	         cache: false, contentType: false, processData: false,
	         success: function (data) {
					  console.log(data);
 	                  if(data['cnt']) {   
						  $("#hupload").css({'display': 'none'});
						  $("#fileupload").css({'display': 'none'});
						  $("#clearbtn").css({'display': 'none'});
						  $("#uploadbtn").css({'display': 'none'});
						  $("#dcontact").css({'display': 'none'});
						  document.getElementById('prog').innerHTML = "<h3 style=\"color: red;\">Files Uploaded - THANK YOU !</h3>";
						  }
					  else	  
					      {document.getElementById('prog').innerHTML = "<h3 style=\"color: red;\">ERROR uploading - please try again or email: <a href=\"mailto: skates@sams.ac.uk\">skates@sams.ac.uk</a></h3><br />";}
					  }, //success
			 error: function(xhr, textStatus, errorThrown) {		  
                    console.log('ajax loading error...'+textStatus+"\n"+errorThrown);
                   return false;
                   }, //error
             }); //ajax
}; //function uploadfiles
