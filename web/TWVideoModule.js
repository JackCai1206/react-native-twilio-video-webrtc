import { EventEmitter } from 'events';
import TW, { Room, VideoTrack } from 'twilio-video';

export const supportedEvents = [
    "roomDidConnect",
    "roomDidDisconnect",
    "roomDidFailToConnect",
    "roomParticipantDidConnect",
    "roomParticipantDidDisconnect",
    "participantAddedVideoTrack",
    "participantRemovedVideoTrack",
    "participantAddedDataTrack",
    "participantRemovedDataTrack",
    "participantAddedAudioTrack",
    "participantRemovedAudioTrack",
    "participantEnabledVideoTrack",
    "participantDisabledVideoTrack",
    "participantEnabledAudioTrack",
    "participantDisabledAudioTrack",
    "dataTrackMessageReceived",
    "cameraDidStopRunning",
    "cameraDidStart",
    "cameraWasInterrupted",
    "cameraInterruptionEnded",
    "statsReceived",
    "networkQualityLevelsChanged"
]

let myRoom;
let listening;
let localVideoTrack;
let localAudioTrack;
const remoteVideoTracks = [];
const remoteAudioTracks = [];
const eventEmitter = new EventEmitter();

const audioElements = new Map();

// https://www.twilio.com/docs/video/tutorials/developing-high-quality-video-applications#grid-mode
function connect(roomName, accessToken, enableVideo, encodingParameters, enableNetworkQualityReporting) {
    TW.connect(accessToken, {
        name: roomName,
        video: enableVideo,
        audio: true,
        networkQuality: enableNetworkQualityReporting,
        tracks: [localVideoTrack, localAudioTrack]
    }).then(room => {
        myRoom = room;
        if (listening) {
            eventEmitter.emit('roomDidConnect', { roomName: room.name, roomSid: room.sid, participants: room.participants })
            _registerEvents(room);
        }
        window.addEventListener('beforeunload', () => room.disconnect());
        window.addEventListener('pagehide', () => room.disconnect());

        return room;
    }).catch(e => {
        eventEmitter.emit('roomDidFailToConnect', { roomName, roomSid: null, error: e?.message });
    });
}

// function setRemoteAudioPlayback(participantSid, enabled) {
//     const participant = room.participants.get(participantSid);
//     if (participant) {
//         participant.audioTracks.forEach(publication => {
//             publication.track.isEnabled = enabled;
//         })
//     }
// }

function disconnect() {
    myRoom.disconnect();
    myRoom = null;
}

function changeListenerStatus(value) {
    listening = value;
}

function startLocalVideo() {
    TW.createLocalVideoTrack().then(track => {
        eventEmitter.emit('cameraDidStart');
        localVideoTrack = track;
    });
}

function startLocalAudio() {
    TW.createLocalAudioTrack().then(track => localAudioTrack = track);
}

function stopLocalVideo() {
    localVideoTrack.stop();
    localVideoTrack = null;
    eventEmitter.emit('cameraDidStopRunning');
    if (myRoom) {
        myRoom.localParticipant.videoTracks.forEach(pub => pub.unpublish());
    }
}

function stopLocalAudio() {
    localAudioTrack.stop();
    localAudioTrack = null;
    if (myRoom) {
        myRoom.localParticipant.audioTracks.forEach(pub => pub.unpublish());
    }
}

export function addLocalView(element) {
    if (localVideoTrack) localVideoTrack.attach(element);
}

export function removeLocalView() {
    if (localVideoTrack) localVideoTrack.detach(element);
}

function setLocalVideoEnabled(enabled) {
    localVideoTrack.enable(enabled);
    return Promise.resolve(enabled)
}

function setLocalAudioEnabled(enabled) {
    localAudioTrack.enable(enabled);
    return Promise.resolve(enabled)
}

function publishLocalVideo() {
    myRoom.localParticipant.publishVideoTrack(localVideoTrack);
}

function publishLocalAudio() {
    myRoom.localParticipant.publishVideoTrack(localAudioTrack);
}

function unpublishLocalVideo() {
    myRoom.localParticipant.videoTracks.forEach(publication => publication.unpublish());
}

function unpublishLocalAudio() {
    myRoom.localParticipant.audioTracks.forEach(publication => publication.unpublish());
}

export function addParticipantView(element, participantSid, trackSid) {
    if (!myRoom) return;
    const participant = myRoom.participants.get(participantSid);
    if (participant) {
        const publication = participant.videoTracks.get(trackSid);
        if (publication) {
            publication.track.attach(element);
        }
    }
}

export function removeParticipantView(element, participantSid, trackSid) {
    if (!myRoom) return;
    const participant = myRoom.participants.get(participantSid);
    if (participant) {
        const publication = participant.videoTracks.get(trackSid);
        if (publication) {
            publication.track.detach(element);
        }
    }
}

function _handleNewTrackEvents(participant, someTrack) {
    const trackInfo = {
        enabled: someTrack.isEnabled,
        trackName: someTrack.name,
        trackSid: someTrack.sid
    };
    if (someTrack.kind === 'video') {
        eventEmitter.emit('participantAddedVideoTrack', { participant, track: trackInfo });
        someTrack.on('disabled', () => {
            eventEmitter.emit('participantDisabledVideoTrack', { participant, track: trackInfo });
        });
        someTrack.on('enabled', () => {
            eventEmitter.emit('participantEnabledVideoTrack', { participant, track: trackInfo });
        });
    } else if (someTrack.kind === 'audio') {
        addRemoteAudio(participant.sid, someTrack.sid);
        eventEmitter.emit('participantAddedAudioTrack', { participant, track: trackInfo });
        someTrack.on('disabled', () => {
            setRemoteAudioPlayback(participant.sid, false);
            eventEmitter.emit('participantDisabledAudioTrack', { participant, track: trackInfo });
        });
        someTrack.on('enabled', () => {
            setRemoteAudioPlayback(participant.sid, true);
            eventEmitter.emit('participantEnabledAudioTrack', { participant, track: trackInfo });
        });
    }
}

function _handleNewParticipantEvents(room, participant) {
    eventEmitter.emit('roomParticipantDidConnect', { roomName: room.name, roomSid: room.sid, participant })
    participant.videoTracks.forEach(publication => {
        if (publication.isSubcribed) {
            _handleNewTrackEvents(participant, publication.track);
        }
        publication.on('unsubscribed', () => {
            const trackInfo = {
                enabled: publication.isTrackEnabled,
                trackName: publication.trackName,
                trackSid: publication.trackSid
            };
            eventEmitter.emit('participantRemovedVideoTrack', { participant, track: trackInfo });
        });
    });

    participant.on('trackSubscribed', someTrack => {
        _handleNewTrackEvents(participant, someTrack);
    });
}

function _registerEvents(room) {
    room.participants.forEach((participant) => _handleNewParticipantEvents(room, participant));
    room.on('participantConnected', participant => _handleNewParticipantEvents(room, participant));
    room.on('participantDisconnected', participant => {eventEmitter.emit('roomParticipantDidDisconnect', { roomName: room.name, roomSid: room.sid, participant })});
}

function flipCamera() {
    console.log('Camera source change not implemented');
}

function addRemoteAudio(participantSid, trackSid) {
    const participant = myRoom.participants.get(participantSid);
    if (participant) {
        const audioTrack = participant.audioTracks.get(trackSid)?.track;
        if (audioTrack) {
            console.log(audioTrack);
            const audioElement = audioElements.get(participantSid) ?? new Audio();
            audioElement.autoplay = true;
            if (!audioTrack.isEnabled) audioElement.muted = true;
            audioTrack.attach(audioElement);
            audioElements.set(participantSid, audioElement);
        }
    }
}

function setRemoteAudioPlayback(participantSid, enabled) {
    const audioElement = audioElements.get(participantSid);
    if (audioElement) {
        audioElement.muted = !enabled;
        console.log(audioElements)
    }
}

export default {
    eventEmitter,
    connect,
    disconnect,
    setRemoteAudioPlayback,
    changeListenerStatus,
    startLocalVideo,
    startLocalAudio,
    stopLocalVideo,
    stopLocalAudio,
    setLocalVideoEnabled,
    setLocalAudioEnabled,
    flipCamera,
    publishLocalVideo,
    publishLocalAudio,
    unpublishLocalVideo,
    unpublishLocalAudio
}
