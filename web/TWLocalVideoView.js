import React, { Component, useEffect, useRef } from 'react'
import { View } from 'react-native';
import { addLocalView, removeLocalView } from './TWVideoModule';

const TWLocalVideoView = ({ enabled, style }) => {
    const videoEl = useRef(null);

    useEffect(() => {
        if (enabled) addLocalView(videoEl.current);
        else removeLocalView(videoEl.current)
        return () => {
            removeLocalView(videoEl.current);
        }
    })

    return (
        <View style={style}>
            <video
                ref={videoEl}
                autoPlay
            ></video>
        </View>
    )
}

export default TWLocalVideoView;
