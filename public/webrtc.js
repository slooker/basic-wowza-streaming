var localVideo = null;
var remoteVideo = null;
var peerConnection = null;
var peerConnectionConfig = {'iceServers': []};
var localStream = null;
var serverConnection = null;
var postURL = "http://localhost:8087/webrtc-session.json";
var streamInfo = {applicationName:"live", streamName:"myStream", sessionId:"[empty]"};

navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

function pageReady()
{
    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');
}

function sendPost(url, params)
{
	var http = new XMLHttpRequest();

	http.open("POST", url, true);

	http.setRequestHeader("Content-Length", params.length);
	http.setRequestHeader("Connection", "close");
	http.setRequestHeader("Accept", "text/plain");
	http.setRequestHeader("Content-Type", "text/plain");

	http.onreadystatechange = function()
	{
    	console.log('http.readyState:'+http.readyState+'  http.status:'+http.status);
		if(http.readyState == 4 && http.status == 200)
		{
	    	console.log(http.responseText);

    		console.log('JSON.parse[before]');
			var theAnswerJSON = JSON.parse(http.responseText);
    		console.log('JSON.parse[after]');

    		var streamInfoResponse = theAnswerJSON['streamInfo'];
    		if (streamInfoResponse !== undefined)
    		{
				streamInfo.sessionId = streamInfoResponse.sessionId;
			}

    		var sdpData = theAnswerJSON['sdp'];
    		if (sdpData !== undefined)
    		{
    			console.log('sdp: '+theAnswerJSON['sdp']);

				peerConnection.setRemoteDescription(new RTCSessionDescription(theAnswerJSON.sdp), function() {
					peerConnection.createAnswer(gotDescription, errorHandler);
				}, errorHandler);
			}

    		var iceCandidates = theAnswerJSON['iceCandidates'];
    		if (iceCandidates !== undefined)
    		{
				for(var index in iceCandidates)
				{
     				console.log('iceCandidates: '+iceCandidates[index]);

       				peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidates[index]));
				}
			}
		}
	}

    console.log('http.send[before]');
	http.send(params);
    console.log('http.send[after]');
}

function getUserMediaSuccess(stream) {
    localStream = stream;
    localVideo.src = window.URL.createObjectURL(stream);
}

function start(isCaller) {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.onaddstream = gotRemoteStream;

    if (localStream !== null)
    {
	    peerConnection.addStream(localStream);
	}

    if(isCaller) {
        //peerConnection.createOffer(gotDescription, errorHandler);
        //serverConnection.send('{"command":"go"}');

		console.log("postURL: "+postURL);

        sendPost(postURL, '{"direction":"play", "command":"getOffer", "streamInfo":'+JSON.stringify(streamInfo)+'}');
    }
}

function gotMessageFromServer(message) {
    //if(!peerConnection) start(false);

    var signal = JSON.parse(message.data);
    if(signal.sdp) {

		if (signal.sdp.type == 'offer')
		{
    		console.log('sdp:offser');
    		console.log(signal.sdp.sdp);
			peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp), function() {
				peerConnection.createAnswer(gotDescription, errorHandler);
			}, errorHandler);
		}
		else
		{
    		console.log('sdp:not-offer: '+signal.sdp.type);
		}

    }
    else if(signal.ice)
    {
    	console.log('ice: '+JSON.stringify(signal.ice));
		peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
    }
}

function gotIceCandidate(event) {
    if(event.candidate != null) {
        //serverConnection.send(JSON.stringify({'ice': event.candidate}));
    }
}

function gotDescription(description) {
    console.log('got description');
    peerConnection.setLocalDescription(description, function () {
        //serverConnection.send(JSON.stringify({'sdp': description}));

    	console.log('sendAnswer');

        sendPost(postURL, '{"direction":"play", "command":"sendResponse", "streamInfo":'+JSON.stringify(streamInfo)+', "sdp":'+JSON.stringify(description)+'}');

    }, function() {console.log('set description error')});
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}

function errorHandler(error) {
    console.log(error);
}
