import React from 'react';
import {DeckComponent} from './DeckComponent';
import MapComponent from './MapComponent';

class GamePage extends React.Component {
  // props:
// playerInfo - dict from top level.
// gameInfo - dict from top level
// beGateway - BE gateway
// showpageFunc - to jump to a different top-level UI
// onPlayerDeckBEChange={() => the deck has changed on the BE, reload.

  render() {
    return (<div>
      Welcome to game <b>'{this.props.gameInfo.name}'</b>
      <MapComponent map={this.props.gameInfo.map} showPageFunc={(which, extra) => this.props.showPageFunc(which, extra)}
      beGateway={this.props.beGateway} gameId={this.props.gameInfo.gameId} playerId={this.props.playerInfo.playerId}
      onPlayerDeckBEChange={() => this.props.onPlayerDeckBEChange()} />
      <DeckComponent deck={this.props.playerInfo.deck} baseCards={this.props.gameInfo.baseCards} ronly={true}/>
    </div>);
  }
}
export default GamePage;
