import { EventEmitter } from 'react-native';
import TW, { VideoTrack } from 'twilio-video';

const supportedEvents = [
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

let room;
let listening;
let localVideoTrack;
let localAudioTrack;
const eventEmitter = new EventEmitter();

function connect(roomName, accessToken, enableVideo, encodingParameters, enableNetworkQualityReporting) {
    room = TW.connect(accessToken, {
        name: roomName,
        video: enableVideo,
        networkQuality: enableNetworkQualityReporting,
        tracks: [localVideoTrack, localAudioTrack]
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
    room.disconnect();
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
}

function stopLocalAudio() {
    localAudioTrack.stop();
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
    setLocalAudioEnabled
}
