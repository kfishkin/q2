import React from 'react';
// props:
// message - message to show
// type - type of message. One of "info", "sucess", "warning", or "error"
// onClick - f to call on click. optional.


class StatusMessage extends React.Component {
  render() {
    return (
     <div className="status_message" flavor={this.props.type}
       onClick={(e) => { if (this.props.onClick) this.props.onClick(e)}}>
        <span className="status_text">{this.props.message}</span>
    </div>
    )
  }
}


export default StatusMessage;