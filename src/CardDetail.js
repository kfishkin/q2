import React from 'react';
import { CardType } from './CardType';

// props: 
//  card - the card to show detail for.
// gameInfo - top-level game info, needed for the description/semantics.
// deck - the players current deck
class CardDetail extends React.Component {
  render() {
    if (!this.props.card) {
      return;
    }
    let card = this.props.card;
    let gc = card.game_card;
    let typeObj = CardType.make(gc.type)
    let line1 = <span>This is a level {gc.level} <i>{typeObj.AltText()}</i> card.</span>;
    let line2 = <span>It has a battle value of <b>{gc.battle_value}</b></span>;
    let line3 = typeObj.FullyDescribe(card, this.props.gameInfo, this.props.deck);

    return (<div>{line1}<br/>{line2}<br/>{line3}</div>)
  }
}
export default CardDetail;
