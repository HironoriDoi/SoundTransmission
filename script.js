'use strict';

let localStream = null;
let peer = null;
let existingCall = null;


navigator.mediaDevices.enumerateDevices()
    .then(function(devices)
    { // 成功時
        devices.forEach(function(device)
        {
            // audio input を dropdown に追加
            if(device.kind == 'audioinput')
            {
                $('#audio_in').append($("<option>").val(device.deviceId).text(device.label));
                //console.log(device.kind + ": " + device.label);
            }

            if(device.kind == 'audiooutput')
            {
                $('#audio_out').append($("<option>").val(device.deviceId).text(device.label));
                //console.log(device.kind + ": " + device.label);
            }
            
        });
    })
    .catch(function(err)
    { // エラー発生時
        console.error('enumerateDevide ERROR:', err);
    });


$('#audio_in').change(isInputAudioChanged);
$('#audio_out').change(isOutputAudioChanged);

$('#audio_in').selectedIndex = 0;

isInputAudioChanged();  // default を選ぶ（初期設定）
//isOutputAudioChanged();

//var isInputAudioChanged
function isInputAudioChanged()
{
    var device = $('#audio_in').val();
    console.log(device);

    var constraints = {
        video: false, 
        audio: {
            deviceId: device, 
            channelCount: 1, 
            echoCancellation: false
        }
    }

    navigator.mediaDevices.getUserMedia(constraints)
    .then(function (stream) {
        // Success
        //$('#my-video').get(0).srcObject = stream;
        localStream = stream;
    }).catch(function (error) {
        // Error
        console.error('mediaDevice.getUserMedia() error:', error);
        return;
    });
}

function isOutputAudioChanged()
{
    var out_audio_id = $('#audio_out').val();

    const audioElement = document.getElementById("their-video");

    audioElement.setSinkId(out_audio_id)
    .then(function() 
    {
         console.log('setSinkID Success');
    })
    .catch(function(err) 
    {
        console.error('setSinkId Err:', err);
    });
}



peer = new Peer({
    key: 'baa1abe1-3d38-470a-976f-d3f8ae4ce8f9',
    debug: 3
});

peer.on('open', function(){
    $('#my-id').text(peer.id);
});

peer.on('error', function(err){
    alert(err.message);
});

peer.on('close', function(){
});

peer.on('disconnected', function(){
});

$('#make-call').submit(function(e){
    e.preventDefault();
    // peer ID を指定して相手を呼び出す
    //const call = peer.call($('#callto-id').val(), localStream, {audioCodec: 'Opus'});
    const call = peer.call($('#callto-id').val(), localStream);
    setupCallEventHandlers(call);
});


$('#end-call').click(function(){
    existingCall.close();
});

// 着信があると call イベントが発火
peer.on('call', function(call){
    call.answer(localStream);
    setupCallEventHandlers(call);
});


function setupCallEventHandlers(call){
    if (existingCall) {
        existingCall.close();
    };

    existingCall = call;

    call.on('stream', function(stream){
        addVideo(call,stream);
        setupEndCallUI();
        $('#their-id').text(call.remoteId);
    });

    call.on('close', function(){
        removeVideo(call.remoteId);
        setupMakeCallUI();
    });
}

function addVideo(call,stream){
    $('#their-video').get(0).srcObject = stream;
}

function removeVideo(peerId){
    $('#their-video').get(0).srcObject = undefined;
}

function setupMakeCallUI(){
    $('#make-call').show();
    $('#end-call').hide();
}

function setupEndCallUI() {
    $('#make-call').hide();
    $('#end-call').show();
}