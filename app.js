// Set constraints for the video stream
var constraints = {
	video: {
		frameRate: {
			ideal: 10,
			max: 15
		},
		facingMode: "user"
	},
	audio: false
};
// Define constants
const cameraView = document.querySelector("#camera--view"),
    cameraOutput = document.querySelector("#camera--output"),
    cameraSensor = document.querySelector("#camera--sensor"),
	cameraTrigger = document.querySelector("#camera--trigger");

console.re.log('init');

// Access the device camera and stream to cameraView
function cameraStart() {
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function(stream) {
        track = stream.getTracks()[0];
        cameraView.srcObject = stream;
    })
    .catch(function(error) {
        console.error("Oops. Something is broken.", error);
    });
}
// Take a picture when cameraTrigger is tapped

cameraTrigger.onclick = function() {

	console.re.log('Click');

	cameraSensor.width = cameraView.videoWidth;
    cameraSensor.height = cameraView.videoHeight;
    cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
	cameraOutput.src = cameraSensor.toDataURL("image/webp");
	cameraOutput.classList.add("taken");

	ImageData = makeblob( cameraOutput.src )

	faceDetection( ImageData );

//	console.re.log( cameraOutput.src.replace(/^data:image\/(png|jpg);base64,/, "") );
//	var BlobData = cameraOutput.src.replace(/^data:image\/(png|jpg);base64,/, "");

//	var BlobData = atob(cameraOutput.src.replace(/^data:image\/(png|jpg);base64,/, ""));

//	console.re.log( BlobData );

//	var BlobData = new Uint8Array();
//	for (var i = 0; i < byteString.length; i++) {
//		BlobData[i] = byteString.charCodeAt(i);
//	}

}

function autoSnapshot()
{
	cameraSensor.width = cameraView.videoWidth;
    cameraSensor.height = cameraView.videoHeight;
    cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
	ImageData = makeblob( cameraSensor.toDataURL("image/webp") );
	faceDetection( ImageData );

	setTimeout( autoSnapshot, 5000 );
}

makeblob = function ( dataURL ) {
	var BASE64_MARKER = ';base64,';
	if (dataURL.indexOf(BASE64_MARKER) == -1) {
		var parts = dataURL.split(',');
		var contentType = parts[0].split(':')[1];
		var raw = decodeURIComponent(parts[1]);
		return new Blob([raw], { type: contentType });
	}
	var parts = dataURL.split(BASE64_MARKER);
	var contentType = parts[0].split(':')[1];
	var raw = window.atob(parts[1]);
	var rawLength = raw.length;

	var uInt8Array = new Uint8Array(rawLength);

	for (var i = 0; i < rawLength; ++i) {
		uInt8Array[i] = raw.charCodeAt(i);
	}

	return new Blob([uInt8Array], { type: contentType });
}

function faceDetection( ImageData )
{
	console.re.log('faceDetection');

	var subscriptionKey = 'ac0d349a5f484eaeb7b2746630a90342';
	var uriBase = 'https://livefacedetection-faceapi.cognitiveservices.azure.com/face/v1.0/detect';

	// Request parameters.
	var params = {
		"returnFaceId": "true",
		"returnFaceLandmarks": "false",
		"returnFaceAttributes":
			"age,gender,headPose,smile,facialHair,glasses,emotion," +
			"hair,makeup,occlusion,accessories,blur,exposure,noise"
	};

	console.re.log('Image data size: ' + ImageData.length );

	// Perform the REST API call.
	$.ajax({
		url: uriBase + "?" + $.param(params),
		type: "POST",
		processData: false,
		beforeSend: function(xhrObj){
			xhrObj.setRequestHeader("Content-Type","application/octet-stream");
			xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
		},
		data: ImageData,
	})

	.done(function(data) {
		// Show formatted JSON on webpage.
		jsonData = JSON.stringify(data, null, 2);
		console.re.log( jsonData );

		// get Gender
		if ( data[0].faceAttributes.gender == 'male')
			var gender = 'MÄĹźczyzna'
		else
			var gender = 'Kobieta'

		// get Age
		var age = data[0].faceAttributes.age;

		// get Emotion
		emotionObj = data[0].faceAttributes.emotion;

		var valueList = $.map(emotionObj,function(v){ return v; });
		var max = valueList.reduce(function(a, b) { return Math.max(a, b); });
		var min = valueList.reduce(function(a, b) { return Math.min(a, b); });

		$.each(emotionObj, function( name, value) {
			if (value == max)
				emotion = name;
		});

		// get Gender
		switch ( emotion )
		{
			case 'anger':
				var emotion = 'złośćÄ'; break;
			case 'contempt':
				var emotion = 'pogarda'; break;
			case 'disgust':
				var emotion = 'niesmak'; break;
			case 'fear':
				var emotion = 'strach'; break;
			case 'happiness':
				var emotion = 'szczęście'; break;
			case 'neutral':
				var emotion = 'neutralnie'; break;
			case 'sadness':
				var emotion = 'smutek'; break;
			case 'surprise':
				var emotion = 'zaskoczenie'; break;
		}

		var ReturnString = gender + ', ' + age + 'lat, ' + emotion + '.\n' + new Date().toLocaleString();
		console.re.log( ReturnString );
		$('#camera-info').html(ReturnString);
	})

	.fail(function(jqXHR, textStatus, errorThrown) {
		// Display error message.
		var errorString = (errorThrown === "") ?
			"Error. " : errorThrown + " (" + jqXHR.status + "): ";
		errorString += (jqXHR.responseText === "") ?
			"" : (jQuery.parseJSON(jqXHR.responseText).message) ?
				jQuery.parseJSON(jqXHR.responseText).message :
					jQuery.parseJSON(jqXHR.responseText).error.message;
		alert(errorString);
	});
};


// Start the video stream when the window loads
window.addEventListener("load", cameraStart, false);
setTimeout( autoSnapshot, 5000 );
