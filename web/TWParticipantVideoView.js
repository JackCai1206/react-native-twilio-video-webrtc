import { View } from 'react-native';
import { addParticipantView, removeParticipantView } from './TWVideoModule';

const TWParticipantVideoView = (trackIdentifier) => {
    const videoEl = useRef(null);

    useEffect(() => {
        addParticipantView(videoEl.current, trackIdentifier.participantSid, trackIdentifier.videoTrackSid);
        // if (enabled) addParticipantView(videoEl.current, participantSid, trackSid);
        // else removeParticipantView(videoEl.current, participantSid, trackSid)
    })

    return (
        <View>
            <video
                ref={videoEl}
                autoPlay
            ></video>
        </View>
    )
}

export default TWParticipantVideoView;
