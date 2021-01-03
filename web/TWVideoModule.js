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

function connect(roomName, accessToken, enableVideo, encodingParameters, enableNetworkQualityReporting) {
    TW.connect(accessToken, {
        name: roomName,
        video: enableVideo,
        networkQuality: enableNetworkQualityReporting,
        tracks: [localVideoTrack, localAudioTrack]
    }).then(room => {
        myRoom = room;
        if (listening) {
            eventEmitter.emit('roomDidConnect', { roomName: room.name, roomSid: room.sid, participants: room.participants })
            _registerEvents(room);
        }
        return room;
    }).catch(e => {
        eventEmitter.emit('roomDidFailToConnect', { roomName, roomSid: null, error: e?.message });
    });
}

function setRemoteAudioPlayback(participantSid, enabled) {
    const participant = room.participants.get(participantSid);
    if (participant) {
        participant.audioTracks.forEach(publication => {
            publication.track.isEnabled = enabled;
        })
    }
}

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
}

function setLocalAudioEnabled(enabled) {
    localAudioTrack.enable(enabled);
}

function publishLocalVideo() {
    room.localParticipant.publishVideoTrack(localVideoTrack);
}

function publishLocalAudio() {
    room.localParticipant.publishVideoTrack(localAudioTrack);
}

function unpublishLocalVideo() {

}

function unpublishLocalAudio() {

}

export function addParticipantView(element, participantSid, trackSid) {
    if (!myRoom) return;
    const participant = myRoom.participants.get(participantSid);
    if (participant) {
        console.log(participant);
        participant.videoTracks.forEach(publication => {
            if (publication.track.sid === trackSid) {
                publication.track.attach(element);
            }
        })
    }
}

export function removeParticipantView(element, participantSid, trackSid) {
    if (!myRoom) return;
    const participant = myRoom.participants.get(participantSid);
    if (participant) {
        for (const {track} of participant.videoTracks) {
            if (track.sid === trackSid) {
                track.detach(element);
            }
        }
    }
}

function _handleNewTrackEvents(participant, someTrack) {
    const track = {
        enabled: someTrack.isEnabled,
        trackName: someTrack.name,
        trackSid: someTrack.sid
    };
    eventEmitter.emit('participantAddedVideoTrack', { participant, track });
    someTrack.on('disabled', () => {
        eventEmitter.emit('participantDisabledVideoTrack', { participant, track });
    });
    someTrack.on('enabled', () => {
        eventEmitter.emit('participantEnabledVideoTrack', { participant, track });
    });
}

function _handleNewParticipantEvents(room, participant) {
    eventEmitter.emit('roomParticipantDidConnect', { roomName: room.name, roomSid: room.sid, participant })
    participant.videoTracks.forEach(publication => {
        if (publication.isSubcribed) {
            _handleNewTrackEvents(participant, track);
        }
        publication.on('unsubscribed', () => {
            eventEmitter.emit('participantRemovedVideoTrack', { participant, track });
        });
    });

    participant.on('trackSubscribed', someTrack => {
        if (someTrack.kind === 'video') {
            _handleNewTrackEvents(participant, someTrack);
        }
    });
}

function _registerEvents(room) {
    room.participants.forEach((participant) => _handleNewParticipantEvents(room, participant));
    room.on('participantConnected', (participant) => _handleNewParticipantEvents(room, participant));
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
}
