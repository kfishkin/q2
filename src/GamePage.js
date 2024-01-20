import React from 'react';
import { Button, Form, Input } from 'antd';



// props:
// playerInfo - dict from top level.

class GamePage extends React.Component {
  //navigate = useNavigate();

  render() {
    let playerInfo = this.props.playerInfo;
    
    if (!playerInfo || !playerInfo.handle) {
      return <div>No game yet, you are not logged in</div>
    }
    let {handle, displayName, gameId} = playerInfo;
    if (!gameId) {
      return <div>Hello {displayName}. You have no game going, would you like to create one?</div>
    }

    return (
      <div>
        Player handle: {handle||"Unknown"}
        <br/>
        Player display name: {displayName||"Unknown"}
        <br/>
        Player gameId: {gameId||"Unknown"}
      </div>


    )
  }
}

export default GamePage;