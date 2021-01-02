import React, { Component } from 'react'
import PropTypes from 'prop-types'
import TWParticipantVideoView from '../web/TWParticipantVideoView'

class TwilioVideoParticipantView extends Component {
  static propTypes = {
    trackIdentifier: PropTypes.shape({
      /** 
       * The participant sid.
       */
      participantSid: PropTypes.string.isRequired,
      /**
       * The participant's video track sid you want to render in the view.
       */
      videoTrackSid: PropTypes.string.isRequired
    })
  }

  render () {
    const scalesType = this.props.scaleType === 'fit' ? 1 : 2
    return (
      <TWParticipantVideoView scalesType={scalesType} {...this.props}>
        {this.props.children}
      </TWParticipantVideoView>
    )
  }
}

export default TwilioVideoParticipantView
