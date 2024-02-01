import React from 'react';
import DeckComponent from './DeckComponent';
import MapComponent from './MapComponent';

class GamePage extends React.Component {
  // props:
// playerInfo - dict from top level.
// gameInfo - dict from top level
// beGateway - BE gateway
// showpageFunc - to jump to a different top-level UI
  render() {
    return (<div>
      Welcome to game '{this.props.gameInfo.name}'
      <MapComponent map={this.props.gameInfo.map} showPageFunc={(which, extra) => this.props.showPageFunc(which, extra)}
      beGateway={this.props.beGateway} />
      <DeckComponent deck={this.props.playerInfo.deck} gameInfo={this.props.gameInfo}/>
    </div>);
  }
}
export default GamePage;
