import { EventEmitter } from "events";
import TW, { Room, VideoTrack } from "twilio-video";

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
	"networkQualityLevelsChanged",
];

let myRoom;
let listening;
let localVideoTrack;
let localAudioTrack;
let startingVideo = false;
let startingAudio = false;
const remoteVideoTracks = [];
const remoteAudioTracks = [];
const eventEmitter = new EventEmitter();

const audioElements = new Map();

// https://www.twilio.com/docs/video/tutorials/developing-high-quality-video-applications#grid-mode
function connect(
	roomName,
	accessToken,
	enableVideo,
	encodingParameters,
	enableNetworkQualityReporting
) {
	// console.log(localVideoTrack, localAudioTrack);
	TW.connect(accessToken, {
		name: roomName,
		video: enableVideo,
		audio: true,
		networkQuality: enableNetworkQualityReporting,
		tracks: [localVideoTrack, localAudioTrack],
	})
		.then((room) => {
			myRoom = room;
			if (listening) {
				eventEmitter.emit("roomDidConnect", {
					roomName: room.name,
					roomSid: room.sid,
					participants: room.participants,
				});
				_registerEvents(room);
			}
			window.addEventListener("beforeunload", () => room.disconnect());
			window.addEventListener("pagehide", () => room.disconnect());

			room.once("disconnected", (room, error) => {
				eventEmitter.emit("roomDidDisconnect", { roomName: room.name, error });
			});

			return room;
		})
		.catch((e) => {
			eventEmitter.emit("roomDidFailToConnect", {
				roomName,
				roomSid: null,
				error: e?.message,
			});
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
	console.log("disconnect");
	if (myRoom) myRoom.disconnect();
	myRoom = null;
}

function changeListenerStatus(value) {
	listening = value;
}

async function startLocalVideo() {
	if (!localVideoTrack && !startingVideo) {
		startingVideo = true;
		console.log('starting video');
		const track = await TW.createLocalVideoTrack();
		localVideoTrack = track;
		eventEmitter.emit("cameraDidStart");
		startingVideo = false;
	}
}

async function startLocalAudio() {
	if (!localAudioTrack && !startingAudio) {
		startingAudio = true;
		console.log('starting audio');
		const track = await TW.createLocalAudioTrack();
		localAudioTrack = track;
		startingAudio = false;
	}
}

function stopLocalVideo() {
	console.log('Stopping video');
	if (localVideoTrack) localVideoTrack.stop();
	localVideoTrack = null;
	eventEmitter.emit("cameraDidStopRunning");
	if (myRoom) {
		myRoom.localParticipant.videoTracks.forEach((pub) => pub.unpublish());
	}
}

function stopLocalAudio() {
	console.log('stopping audio');
	if (localAudioTrack) localAudioTrack.stop();
	localAudioTrack = null;
	if (myRoom) {
		myRoom.localParticipant.audioTracks.forEach((pub) => pub.unpublish());
	}
}

export function addLocalView(element) {
	if (localVideoTrack) localVideoTrack.attach(element);
}

export function removeLocalView(element) {
	if (localVideoTrack) localVideoTrack.detach(element);
}

async function setLocalVideoEnabled(enabled) {
	console.log('set video', enabled, localVideoTrack);
	if (localVideoTrack) {
		// localVideoTrack.enable(enabled);
		if (!enabled) {
			stopLocalVideo();
		}
	} else if (enabled) {
		await startLocalVideo();
	}
	return Promise.resolve(enabled);
}

async function setLocalAudioEnabled(enabled) {
	if (localAudioTrack) {
		// localAudioTrack.enable(enabled);
		if (!enabled) {
			stopLocalAudio();
		}
	} else if (enabled) {
		await startLocalAudio();
	}
	return Promise.resolve(enabled);
}

function publishLocalVideo() {
	if (myRoom) {
		myRoom.localParticipant.publishVideoTrack(localVideoTrack);
	}
}

function publishLocalAudio() {
	if (myRoom) {
		myRoom.localParticipant.publishAudioTrack(localAudioTrack);
	}
}

function unpublishLocalVideo() {
	if (myRoom) {
		myRoom.localParticipant.videoTracks.forEach((publication) =>
			publication.unpublish()
		);
	}
}

function unpublishLocalAudio() {
	if (myRoom) {
		myRoom.localParticipant.audioTracks.forEach((publication) =>
			publication.unpublish()
		);
	}
}

export function addParticipantView(element, participantSid, trackSid) {
	if (!myRoom) return;
	const participant = myRoom.participants.get(participantSid);
	if (participant) {
		const publication = participant.videoTracks.get(trackSid);
		if (publication && publication.track) {
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
		trackSid: someTrack.sid,
	};
	if (someTrack.kind === "video") {
		eventEmitter.emit("participantAddedVideoTrack", {
			participant,
			track: trackInfo,
		});
		someTrack.on("disabled", () => {
			eventEmitter.emit("participantDisabledVideoTrack", {
				participant,
				track: trackInfo,
			});
		});
		someTrack.on("enabled", () => {
			eventEmitter.emit("participantEnabledVideoTrack", {
				participant,
				track: trackInfo,
			});
		});
	} else if (someTrack.kind === "audio") {
		addRemoteAudio(participant.sid, someTrack.sid);
		eventEmitter.emit("participantAddedAudioTrack", {
			participant,
			track: trackInfo,
		});
		someTrack.on("disabled", () => {
			setRemoteAudioPlayback(participant.sid, false);
			eventEmitter.emit("participantDisabledAudioTrack", {
				participant,
				track: trackInfo,
			});
		});
		someTrack.on("enabled", () => {
			setRemoteAudioPlayback(participant.sid, true);
			eventEmitter.emit("participantEnabledAudioTrack", {
				participant,
				track: trackInfo,
			});
		});
	}
}

function _handleNewParticipantEvents(room, participant) {
	eventEmitter.emit("roomParticipantDidConnect", {
		roomName: room.name,
		roomSid: room.sid,
		participant,
	});
	participant.videoTracks.forEach((publication) => {
		if (publication.isSubcribed) {
			_handleNewTrackEvents(participant, publication.track);
		}
		publication.on("unsubscribed", () => {
			const trackInfo = {
				enabled: publication.isTrackEnabled,
				trackName: publication.trackName,
				trackSid: publication.trackSid,
			};
			eventEmitter.emit("participantRemovedVideoTrack", {
				participant,
				track: trackInfo,
			});
		});
	});

	participant.on("trackSubscribed", (someTrack) => {
		_handleNewTrackEvents(participant, someTrack);
	});
}

function _registerEvents(room) {
	room.participants.forEach((participant) =>
		_handleNewParticipantEvents(room, participant)
	);
	room.on("participantConnected", (participant) =>
		_handleNewParticipantEvents(room, participant)
	);
	room.on("participantDisconnected", (participant) => {
		eventEmitter.emit("roomParticipantDidDisconnect", {
			roomName: room.name,
			roomSid: room.sid,
			participant,
		});
	});
}

function flipCamera() {
	console.log("Camera source change not implemented");
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
		console.log(audioElements);
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
	unpublishLocalAudio,
};
