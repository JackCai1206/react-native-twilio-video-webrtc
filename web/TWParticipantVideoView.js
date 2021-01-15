import React, { Component, useEffect, useRef } from 'react'
import { View } from 'react-native';
import { addParticipantView, removeParticipantView } from './TWVideoModule';

const TWParticipantVideoView = ({ trackIdentifier, style }) => {
    const videoEl = useRef(null);

    useEffect(() => {
        addParticipantView(videoEl.current, trackIdentifier.participantSid, trackIdentifier.videoTrackSid);
        // if (enabled) addParticipantView(videoEl.current, participantSid, trackSid);
        // else removeParticipantView(videoEl.current, participantSid, trackSid)
    })

    return (
        <View style={style}>
            <video
                width={'100%'}
                height={'100%'}
                ref={videoEl}
                autoPlay
            ></video>
        </View>
    )
}

export default TWParticipantVideoView;
