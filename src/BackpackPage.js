import React from 'react';
import { DeckComponentBackpack, DeckComponentBackpackable } from './DeckComponent';
import { PlayerStates } from './PlayerStates';

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
  backpackPart() {
    const onFromBackpack = (cards) => {
      let ids = cards.map((card) => card.getId());
      this.props.beGateway.setBackpack(ids, false).then((v) => {
        console.log(`fromBackpack: v = ${v}`);
        // also do it internally, just in case.
        cards = cards.map((card) => card.setBackpack(true));
        // TODO: rerender w/o waiting for BEchange, which can take a while.
        // or at least use StatusMessage
        this.props.onPlayerDeckBEChange();
      }).catch((e) => {
        console.log(`err in onFromBackpack: ${e}`);
      })
    }   
    // only show cards which are in the backpack...
    let backpackCards = this.props.deck.filter((card) => card.inBackpack());    
    return (
      <DeckComponentBackpack deck={backpackCards} baseCards={this.props.baseCards}
        current="yes"
        onTransact={(cards) => onFromBackpack(cards)} />)
  }
  
  nonBackpackPart() {
    // only show if at home.
    if (this.props.playerState !== PlayerStates.HOME) {
      return '';
    }
    const onToBackpack = (cards) => {
      console.log(`onToBackpack: cards = ${JSON.stringify(cards)}`);
      let ids = cards.map((card) => card.getId());
      this.props.beGateway.setBackpack(ids, true).then((v) => {
        // also do it internally, just in case.
        cards = cards.map((card) => card.setBackpack(true));
        this.props.onPlayerDeckBEChange();
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
      Hello from the backpack page.
      Player state = {this.props.playerState}
      <h2>Your backpack</h2>
      {this.backpackPart()}
      <hr />
      {this.nonBackpackPart()}
    </div>);
  }
}
export default BackpackPage;
