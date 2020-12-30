import React, { Component } from 'react'
import PropTypes from 'prop-types'
import TWLocalVideoView from '../web/TWLocalVideoView'

class TwilioVideoLocalView extends Component {
  static propTypes = {
    /**
     * Indicate if video feed is enabled.
     */
    enabled: PropTypes.bool.isRequired
  }

  render () {
    const scalesType = this.props.scaleType === 'fit' ? 1 : 2

    return (
      <TWLocalVideoView scalesType={scalesType} {...this.props}>
        {this.props.children}
      </TWLocalVideoView>
    )
  }
}

export default TwilioVideoLocalView
