import React from 'react';
import { DeckComponentBackpack, DeckComponentBackpackable } from './DeckComponent';
import { PlayerStates } from './PlayerStates';
import StatusMessage from './StatusMessage';

/**
 * Works in two modes. Might make two classes someday
 * HOME mode - shows backup up top, non-backup down bottom, and allows
 *   swapping
 * AWAY mode - read-only.
 * 
 * props
 * playerState - enum
 * baseCards
 * beGateway
 * deck - player deck of cards
 * onPlayerDeckBEChange
 */

class BackpackPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      statusMessage: null,
      statusType: 'info',
    }
  }
  backpackPart() {
    const onFromBackpack = (cards) => {


      // do it internally first, for speed.
      cards = cards.map((card) => { card.setBackpack(false); return card });

      this.setState({statusMessage: 'moving...', statusType: 'info'});
      // this side-effected into the props.deck list.
      this.props.setPlayerDeck(this.props.deck);
      // now let the BE know about it
      this.setState({statusMessage: 'updating BE...', statusType: 'info'});
      let ids = cards.map((card) => card.getId());
      this.props.beGateway.setBackpack(ids, false).then((v) => {
        this.setState({statusMessage: 'moved', statusType: 'info'});
      }).catch((e) => {
        console.log(`err in onFromBackpack: ${e}`);
      })
    }   
    // only show cards which are in the backpack...
    let backpackCards = this.props.deck.filter((card) => card.inBackpack());    
    return (
      <DeckComponentBackpack deck={backpackCards} baseCards={this.props.baseCards}
        current="yes"
        ronly={this.props.playerState !== PlayerStates.HOME}
        onTransact={(cards) => onFromBackpack(cards)} />)
  }
  
  nonBackpackPart() {
    // only show if at home.
    if (this.props.playerState !== PlayerStates.HOME) {
      return '';
    }
    const onToBackpack = (cards) => {
      console.log(`onToBackpack: cards = ${JSON.stringify(cards)}`);
      // do it internally first, for speed.
      cards = cards.map((card) => { card.setBackpack(true); return card });

      this.setState({statusMessage: 'moving...', statusType: 'info'});
      // this side-effected into the props.deck list.
      this.props.setPlayerDeck(this.props.deck);
      // now let the BE know about it
      this.setState({statusMessage: 'updating BE...', statusType: 'info'});
      let ids = cards.map((card) => card.getId());
      this.props.beGateway.setBackpack(ids, true).then((v) => {
        this.setState({statusMessage: 'moved', statusType: 'info'});

      }).catch((e) => {
        console.log(`err in onToBackpack: ${e}`);
      })
      
    }   

    // only show cards NOT in the backpack:
    // only show cards which are in the backpack,
    // and which make sense to show in it.
    let candidates = this.props.deck.filter((card) => !card.inBackpack() && card.isBackpackable());  

    return (
      <div>
        <h2>Your main deck</h2>
      <DeckComponentBackpackable deck={candidates} baseCards={this.props.baseCards}
        current="yes"
        onTransact={(cards) => onToBackpack(cards)} />
    </div>)
  }  

  render() {
    return (<div>
            {this.state.statusMessage ? <StatusMessage message={this.state.statusMessage} type={this.state.statusType} /> : ''}
      {this.backpackPart()}
      <hr />
      {this.nonBackpackPart()}
    </div>);
  }
}
export default BackpackPage;
