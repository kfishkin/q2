import React from 'react';
import DeckComponent from './DeckComponent';

class GamePage extends React.Component {
  // props:
// playerInfo - dict from top level.
// beGateway - BE gateway
  render() {
    return (<div>
      Welcome to game {this.props.playerInfo.currentGameName} 
      ({this.props.playerInfo.currentGameId}),
      deck has {this.props.playerInfo.deck ? this.props.playerInfo.deck.length : "---"} cards.
      <DeckComponent deck={this.props.playerInfo.deck}/>
    </div>);
  }
}
export default GamePage;
