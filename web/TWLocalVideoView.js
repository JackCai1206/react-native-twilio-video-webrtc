import React, { Component, useEffect, useRef } from 'react'
import { View } from 'react-native';
import TW, { addLocalView, removeLocalView } from './TWVideoModule';

const TWLocalVideoView = ({ enabled, style }) => {
    const videoEl = useRef(null);

    useEffect(() => {
        console.log('enable local video', enabled);
        if (enabled) {
            TW.startLocalAudio()
            .then(TW.startLocalVideo)
            .then(() => addLocalView(videoEl.current));
        }
        else {
            TW.stopLocalAudio();
            TW.stopLocalVideo();
            removeLocalView(videoEl.current)
        }
        return () => {
            TW.stopLocalVideo();
            TW.stopLocalAudio();
            removeLocalView(videoEl.current);
        }
    }, [enabled])

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

export default TWLocalVideoView;
