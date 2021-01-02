import { Component } from 'react'
import PropTypes from 'prop-types'
import { NativeModules, NativeEventEmitter, View } from 'react-native'
import TWVideoModule, { supportedEvents } from '../web/TWVideoModule';

export default class extends Component {
  static propTypes = {
    /**
     * Flag that enables screen sharing RCTRootView instead of camera capture
     */
    screenShare: PropTypes.bool,
    /**
     * Called when the room has connected
     *
     * @param {{roomName, participants}}
     */
    onRoomDidConnect: PropTypes.func,
    /**
     * Called when the room has disconnected
     *
     * @param {{roomName, error}}
     */
    onRoomDidDisconnect: PropTypes.func,
    /**
     * Called when connection with room failed
     *
     * @param {{roomName, error}}
     */
    onRoomDidFailToConnect: PropTypes.func,
    /**
     * Called when a new participant has connected
     *
     * @param {{roomName, participant}}
     */
    onRoomParticipantDidConnect: PropTypes.func,
    /**
     * Called when a participant has disconnected
     *
     * @param {{roomName, participant}}
     */
    onRoomParticipantDidDisconnect: PropTypes.func,
    /**
     * Called when a new video track has been added
     *
     * @param {{participant, track, enabled}}
     */
    onParticipantAddedVideoTrack: PropTypes.func,
    /**
     * Called when a video track has been removed
     *
     * @param {{participant, track}}
     */
    onParticipantRemovedVideoTrack: PropTypes.func,
    /**
     * Called when a new data track has been added
     *
     * @param {{participant, track}}
     */
    onParticipantAddedDataTrack: PropTypes.func,
    /**
     * Called when a data track has been removed
     *
     * @param {{participant, track}}
     */
    onParticipantRemovedDataTrack: PropTypes.func,
    /**
     * Called when a new audio track has been added
     *
     * @param {{participant, track}}
     */
    onParticipantAddedAudioTrack: PropTypes.func,
    /**
     * Called when a audio track has been removed
     *
     * @param {{participant, track}}
     */
    onParticipantRemovedAudioTrack: PropTypes.func,
    /**
     * Called when a video track has been enabled.
     *
     * @param {{participant, track}}
     */
    onParticipantEnabledVideoTrack: PropTypes.func,
    /**
     * Called when a video track has been disabled.
     *
     * @param {{participant, track}}
     */
    onParticipantDisabledVideoTrack: PropTypes.func,
    /**
     * Called when an audio track has been enabled.
     *
     * @param {{participant, track}}
     */
    onParticipantEnabledAudioTrack: PropTypes.func,
    /**
     * Called when an audio track has been disabled.
     *
     * @param {{participant, track}}
     */
    onParticipantDisabledAudioTrack: PropTypes.func,
    /**
     * Called when an dataTrack receives a message
     *
     * @param {{message}}
     */
    onDataTrackMessageReceived: PropTypes.func,
    /**
     * Called when the camera has started
     *
     */
    onCameraDidStart: PropTypes.func,
    /**
     * Called when the camera has been interrupted
     *
     */
    onCameraWasInterrupted: PropTypes.func,
    /**
     * Called when the camera interruption has ended
     *
     */
    onCameraInterruptionEnded: PropTypes.func,
    /**
     * Called when the camera has stopped runing with an error
     *
     * @param {{error}} The error message description
     */
    onCameraDidStopRunning: PropTypes.func,
    /**
     * Called when stats are received (after calling getStats)
     *
     */
    onStatsReceived: PropTypes.func,
    /**
     * Called when the network quality levels of a participant have changed (only if enableNetworkQualityReporting is set to True when connecting)
     *
     */
    onNetworkQualityLevelsChanged: PropTypes.func,
    ...View.propTypes
  }

  constructor (props) {
    super(props)

    this._eventEmitter = TWVideoModule.eventEmitter;
  }

  componentWillMount () {
    this._registerEvents()
    this._startLocalVideo()
    this._startLocalAudio()
  }

  componentWillUnmount () {
    this._unregisterEvents()
    this._stopLocalVideo()
    this._stopLocalAudio()
  }

  /**
   * Locally mute/ unmute all remote audio tracks from a given participant
   */
  setRemoteAudioPlayback ({ participantSid, enabled }) {
    TWVideoModule.setRemoteAudioPlayback(participantSid, enabled)
  }

  setRemoteAudioEnabled (enabled) {
    return Promise.resolve(enabled)
  }

  setBluetoothHeadsetConnected (enabled) {
    return Promise.resolve(enabled)
  }

  /**
   * Enable or disable local video
   */
  setLocalVideoEnabled (enabled) {
    return TWVideoModule.setLocalVideoEnabled(enabled)
  }

  /**
   * Enable or disable local audio
   */
  setLocalAudioEnabled (enabled) {
    return TWVideoModule.setLocalAudioEnabled(enabled)
  }

  /**
   * Filp between the front and back camera
   */
  flipCamera () {
    TWVideoModule.flipCamera()
  }

  /**
   * Toggle audio setup from speaker (default) and headset
   */
  toggleSoundSetup (speaker) {
    TWVideoModule.toggleSoundSetup(speaker)
  }

  /**
   * Get connection stats
   */
  getStats () {
    TWVideoModule.getStats()
  }

  /**
   * Connect to given room name using the JWT access token
   * @param  {String} roomName    The connecting room name
   * @param  {String} accessToken The Twilio's JWT access token
   * @param  {String} encodingParameters Control Encoding config
   * @param  {Boolean} enableNetworkQualityReporting Report network quality of participants
   */
  connect ({ roomName, accessToken, enableVideo = true, encodingParameters = null, enableNetworkQualityReporting = false }) {
    TWVideoModule.connect(roomName, accessToken, enableVideo, encodingParameters, enableNetworkQualityReporting);
  }

  /**
   * Disconnect from current room
   */
  disconnect () {
    TWVideoModule.disconnect()
  }

  /**
   * Publish a local audio track
   */
  publishLocalAudio () {
    TWVideoModule.publishLocalAudio()
  }

  /**
   * Publish a local video track
   */
  publishLocalVideo () {
    TWVideoModule.publishLocalVideo()
  }

  /**
   * Unpublish a local audio track
   */
  unpublishLocalAudio () {
    TWVideoModule.unpublishLocalAudio()
  }

  /**
   * Unpublish a local video track
   */
  unpublishLocalVideo () {
    TWVideoModule.unpublishLocalVideo()
  }

  /**
   * SendString to datatrack
   * @param  {String} message    The message string to send
   */
  sendString (message) {
    TWVideoModule.sendString(message)
  }

  _startLocalVideo () {
    TWVideoModule.startLocalVideo()
  }

  _stopLocalVideo () {
    TWVideoModule.stopLocalVideo()
  }

  _startLocalAudio () {
    TWVideoModule.startLocalAudio()
  }

  _stopLocalAudio () {
    TWVideoModule.stopLocalAudio()
  }

  _unregisterEvents () {
    TWVideoModule.changeListenerStatus(false)
    this._eventEmitter.removeAllListeners();
  }

  _registerEvents () {
    TWVideoModule.changeListenerStatus(true);
    for (const eventStr of supportedEvents) {
        this._eventEmitter.addListener(eventStr, data => {
            const handlerStr = 'on' + eventStr.charAt(0).toUpperCase() + eventStr.slice(1);
            if (this.props[handlerStr]) {
                this.props[handlerStr](data);
            }
        });
    }
  }

  render () {
    return this.props.children || null
  }
}
